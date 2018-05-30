import { mat2d, vec2 } from 'gl-matrix';
import { range } from 'lodash';
import { Bone, KeyFrameBezier, Skin, SpineAnimation, Timeline, TimelineType } from 'src/models/SpineAnimation';
import { Store } from 'src/store';
import { bezier, solveBezier } from 'src/utils/bezier';
import { AdditiveBlending, DoubleSide, Face3, Geometry, Group, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry, RepeatWrapping, Scene, Sprite, SpriteMaterial, Texture, Vector2, Vector3 } from 'three';

/* tslint:disable:no-bitwise */

export const ImageSize = 640;

export type CardImageDescriptor = CardImageFrames | CardImageSpine;

export interface CardImageFrames {
  type: 'frames';
  scene: Scene;
  frames: number;
}

export interface CardImageSpine {
  type: 'spine';
  scene: Scene;
  spine: SpineAnimation;
}

function toTexture(image: HTMLImageElement) {
  const texture = new Texture(image);
  texture.flipY = false;
  texture.needsUpdate = true;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

export function makeDefaultScene(store: Store) {
  const scene = new Scene();
  const bgImage = store.assets.lookup('card-image-bg').image;
  const geom = new PlaneGeometry(ImageSize, ImageSize);
  const bg = new Mesh(geom, new MeshBasicMaterial({ map: toTexture(bgImage), side: DoubleSide }));
  bg.position.set(0, ImageSize / 2, 0);
  scene.add(bg);
  return scene;
}

export async function loadId(store: Store, id: number): Promise<CardImageDescriptor> {
  const entry = store.images.resolve('mons', id);
  const scene = makeDefaultScene(store);

  if (entry.files.length === 1) {
    const tex = toTexture(await store.images.fetchImage(entry));
    tex.repeat.y = entry.height / tex.image.height;

    const sprite = new Sprite(new SpriteMaterial({ map: tex }));
    sprite.name = 'frame';
    (sprite as any).center.set(0, 0);
    sprite.position.set(Math.floor(-entry.width / 2), Math.floor(ImageSize * 2 / 3 - entry.height), 1);
    sprite.scale.set(tex.image.width, entry.height, 1);
    scene.add(sprite);

    return {
      type: 'frames',
      scene,
      frames: entry.frames || 1
    };
  } else {
    const [isc, isa] = await Promise.all(
      entry.files.filter(file => file.endsWith('.json')).map(file => store.images.fetchJson(entry, file))
    );
    const images = await Promise.all(
      entry.files.filter(file => file.endsWith('.png')).map(file => store.images.fetchImage(entry, file))
    );
    const spine = SpineAnimation.parseAnimation(isc, isa);

    const root = new Group();
    root.scale.set(1, -1, 1);
    root.translateY(Math.floor(ImageSize * 2 / 3));
    scene.add(root);

    const texs = images.map(image => toTexture(image));
    for (const { skin, tint, isAdditive } of spine.slots) {
      const geom = new Geometry();
      const uvs: Vector2[] = [];
      for (const v of skin.vertices) {
        geom.vertices.push(new Vector3(0, 0, 1));
        uvs.push(new Vector2(v.src[0], v.src[1]));
      }

      geom.faceVertexUvs[0] = [];
      for (const indices of skin.triangles) {
        geom.faces.push(new Face3(indices[0], indices[1], indices[2]));
        geom.faceVertexUvs[0].push([uvs[indices[0]], uvs[indices[1]], uvs[indices[2]]]);
      }
      geom.uvsNeedUpdate = true;

      const mesh = new Mesh(geom, new MeshBasicMaterial({
        map: texs[skin.imageId],
        transparent: true,
        color: tint,
        side: DoubleSide,
        blending: isAdditive ? AdditiveBlending : NormalBlending
      }));
      mesh.name = `skin-${skin.id}`;
      root.add(mesh);
    }

    return {
      type: 'spine',
      scene,
      spine
    };
  }
}

export function updateScene(descriptor: CardImageDescriptor, time: number) {
  switch (descriptor.type) {
    case 'frames':
      updateSceneFrames(descriptor, time);
      break;
    case 'spine':
      updateSceneSpine(descriptor, time);
      break;
  }
}

function updateSceneFrames(descriptor: CardImageFrames, time: number) {
  const offset = Math.floor(time / 0.3) % descriptor.frames;
  const sprite = descriptor.scene.getObjectByName('frame') as Sprite;
  sprite.material.map.offset.set(0, offset / descriptor.frames);
}

function updateSceneSpine(descriptor: CardImageSpine, time: number) {
  const anim = descriptor.spine;
  time = time % anim.length;

  for (const bone of anim.bones) {
    bone.animation.transform.angle = 0;
    bone.animation.transform.sx = 1;
    bone.animation.transform.sy = 1;
    bone.animation.transform.tx = 0;
    bone.animation.transform.ty = 0;
    for (const timeline of bone.animation.timelines)
      updateSpineTimeline(timeline, bone.animation, time);
  }

  for (const slot of anim.slots) {
    slot.animation.tint = 0xffffffff;
    for (const timeline of slot.animation.timelines)
      updateSpineTimeline(timeline, slot.animation, time);

    const skin = slot.skin;
    skin.animation.offsets.length = 0;
    for (const timeline of skin.animation.timelines)
      updateSpineTimeline(timeline, skin.animation, time);
  }

  const transforms: mat2d[] = [];
  const computeTransform = (bone: Bone, parent: mat2d) => {
    const transform = mat2d.clone(parent);

    mat2d.translate(transform, transform, [
      bone.transform.tx + bone.animation.transform.tx,
      bone.transform.ty + bone.animation.transform.ty,
      0
    ]);
    mat2d.rotate(transform, transform, (bone.transform.angle + bone.animation.transform.angle) * Math.PI / 180);
    mat2d.scale(transform, transform, [
      bone.transform.sx * bone.animation.transform.sx,
      bone.transform.sy * bone.animation.transform.sy,
      1
    ]);

    transforms[bone.id] = transform;
    for (const child of bone.children)
      computeTransform(child, transform);
  };
  computeTransform(anim.bones[0], mat2d.identity(mat2d.create()));

  const pt = vec2.create();
  function applyTransform(boneId: number, skin: Skin, i: number, v: vec2) {
    vec2.copy(pt, v);

    const offsets = skin.animation.offsets;
    if (offsets[i]) {
      pt[0] += offsets[i][0];
      pt[1] += offsets[i][1];
    }

    vec2.transformMat2d(pt, pt, transforms[boneId]);

    return pt;
  }
  for (const { bone, skin, tint, animation } of anim.slots) {
    const mesh = descriptor.scene.getObjectByName(`skin-${skin.id}`) as Mesh;
    const material = mesh.material as MeshBasicMaterial;
    const geom = mesh.geometry as Geometry;

    const a = (animation.tint >>> 24) / 0xff;
    material.color.setRGB(
      (((animation.tint >>> 16) & 0xff) * a + ((tint >>> 16) & 0xff) * (1 - a)) / 0xff,
      (((animation.tint >>> 8) & 0xff) * a + ((tint >>> 8) & 0xff) * (1 - a)) / 0xff,
      (((animation.tint >>> 0) & 0xff) * a + ((tint >>> 0) & 0xff) * (1 - a)) / 0xff,
    );
    material.opacity = a;

    for (const i of range(skin.vertices.length)) {
      const dst = skin.vertices[i].dst;
      if (Array.isArray(dst)) {
        const t = vec2.create();
        for (const { boneId, v, ratio } of dst) {
          vec2.scaleAndAdd(t, t, applyTransform(boneId, skin, i, v), ratio);
        }
        geom.vertices[i].set(t[0], t[1], 1);
      } else {
        const t = applyTransform(bone.id, skin, i, dst);
        geom.vertices[i].set(t[0], t[1], 1);
      }
    }
    geom.verticesNeedUpdate = true;
  }
}

function updateSpineTimeline(timeline: Timeline, state: any, time: number) {
  const frames = timeline.frames;
  let nextFrameIndex = frames.findIndex((frame: any) => frame.time > time);
  if (nextFrameIndex < 0) nextFrameIndex = frames.length;

  const thisFrame = frames[(nextFrameIndex - 1 + frames.length) % frames.length];
  const nextFrame = frames[nextFrameIndex] || frames[0];

  function interpolate(a: number, b: number) {
    const duration = nextFrame.time - thisFrame.time;
    if (duration === 0) return a;

    switch (thisFrame.interpolation) {
      default:
      case 'C':
        return a;
      case 'L':
        return a + (b - a) * (time - thisFrame.time) / duration;
      case 'B': {
        const { b1, b2, b3, b4 } = thisFrame as KeyFrameBezier;
        return a + (b - a) * bezier(solveBezier((time - thisFrame.time) / duration, b1, b3), 0, b2, b4, 1);
      }
    }
  }

  function interpolateP(a: [number, number], b: [number, number]) {
    const duration = nextFrame.time - thisFrame.time;
    if (duration === 0) return a;

    const t = (time - thisFrame.time) / duration;
    switch (thisFrame.interpolation) {
      default:
      case 'C':
        return a;
      case 'L':
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      case 'B': {
        const { b1, b2, b3, b4 } = thisFrame as KeyFrameBezier;
        return [bezier(t, a[0], b1, b3, b[0]), bezier(t, a[1], b2, b4, b[1])];
      }
    }
  }

  switch (timeline.type) {
    case TimelineType.Rotate:
      state.transform.angle += interpolate((thisFrame as any).angle, (nextFrame as any).angle);
      break;
    case TimelineType.Translate:
    case TimelineType.Scale:
      const x = interpolate((thisFrame as any).v[0], (nextFrame as any).v[0]);
      const y = interpolate((thisFrame as any).v[1], (nextFrame as any).v[1]);
      if (timeline.type === TimelineType.Translate) {
        state.transform.tx += x;
        state.transform.ty += y;
      } else {
        state.transform.sx *= x;
        state.transform.sy *= y;
      }
      break;
    case TimelineType.Tint: {
      const thisColor = (thisFrame as any).color;
      const nextColor = (nextFrame as any).color;
      state.tint =
        Math.floor(interpolate((thisColor >>> 24) & 0xff, (nextColor >>> 24) & 0xff)) * 0x1000000 +
        Math.floor(interpolate((thisColor >>> 16) & 0xff, (nextColor >>> 16) & 0xff)) * 0x10000 +
        Math.floor(interpolate((thisColor >>> 8) & 0xff, (nextColor >>> 8) & 0xff)) * 0x100 +
        Math.floor(interpolate((thisColor >>> 0) & 0xff, (nextColor >>> 0) & 0xff)) * 0x1;
    } break;
    case TimelineType.Toggle: {
      if (!(thisFrame as any).visible)
        state.tint = 0;
    } break;
    case TimelineType.Offset: {
      const thisPoints: Array<[number, number]> = (thisFrame as any).points;
      const nextPoints: Array<[number, number]> = (nextFrame as any).points;
      const numPoints = Math.max(thisPoints.length, nextPoints.length);
      for (let i = 0; i < numPoints; i++) {
        const thisPoint = thisPoints[i] || [0, 0];
        const nextPoint = nextPoints[i] || [0, 0];
        state.offsets.push(interpolateP(thisPoint, nextPoint));
      }
    } break;
  }
}