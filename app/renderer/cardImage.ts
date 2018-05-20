import { Deferred } from "app/utils/deferred";
import { Store } from "app/store";
import { Entry } from "app/database/image";
import { times, range, flatMap, max } from 'lodash';
import { vec2, mat4, mat2d } from 'gl-matrix';
import {
  WebGLRenderer, Texture, Sprite, SpriteMaterial, Scene, OrthographicCamera,
  Vector2, Vector3, RepeatWrapping, Mesh, Geometry, Face3, MeshBasicMaterial,
  Group, DoubleSide, PlaneGeometry, NormalBlending, AdditiveBlending
} from 'three';

export const CanvasSize = 640;
export const CanvasHeight = 512;

function setCenter(sprite: Sprite, x: number, y: number) {
  (sprite as any).center.set(x, y);
}

export class CardImageRenderer {
  private readonly store = Store.instance;

  private entry: Entry;

  constructor(private readonly id: number) {
    this.entry = this.store.imageDB.resolve('mons', id);
  }

  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: OrthographicCamera;
  render(canvas: HTMLCanvasElement, time: number) {
    if (!this.renderer) {
      this.renderer = new WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(CanvasSize, CanvasHeight);
      this.renderer.sortObjects = false;

      this.camera = new OrthographicCamera(-CanvasSize / 2, CanvasSize / 2, 0, CanvasHeight, 0, 10);
      this.camera.position.z = 10;
    }

    if (this.entry.files.length > 1)
      this.updateSkeleton(canvas, time);
    else
      this.updateFrames(canvas, time);

    if (this.scene) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private images: Deferred<HTMLImageElement>[];
  private metadata: Deferred<any>[];
  private fetchData() {
    if (!this.images) {
      this.images = this.entry.files
        .filter(file => file.endsWith('.png'))
        .map(file => Deferred.from(this.store.imageDB.fetchImage(this.entry, file)));
    }
    if (!this.metadata) {
      this.metadata = this.entry.files
        .filter(file => file.endsWith('.json'))
        .map(file => Deferred.from(this.store.imageDB.fetchFile(this.entry, file)));
    }
    return this.images.every(req => req.fulfilled) && this.metadata.every(req => req.fulfilled);
  }

  private fetchImages = () => this.fetchData() && this.images.map(req => req.result) || [];
  private fetchMetadata = () => this.fetchData() && this.metadata.map(req => req.result) || [];

  private loadTex(image: HTMLImageElement) {
    const texture = new Texture(image);
    texture.flipY = false;
    texture.needsUpdate = true;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
  }

  private createScene() {
    const { image, width: bgSize } = Store.instance.assetDB.assets.get('card-bg');
    this.scene = new Scene();

    const geom = new PlaneGeometry(CanvasSize, CanvasSize);
    const bg = new Mesh(geom, new MeshBasicMaterial({ map: this.loadTex(image), side: DoubleSide }));
    bg.position.set(0, CanvasSize / 2, 0);
    this.scene.add(bg);

    return this.scene;
  }

  private frameSprite: Sprite;
  private updateFrames(canvas: HTMLCanvasElement, time: number) {
    const [image] = this.fetchImages();
    if (!image) return;

    const { width, height, frames } = this.entry;
    const f = frames || 1;
    if (!this.scene) {
      const scene = this.createScene();

      const tex = this.loadTex(image);
      tex.repeat.y = height / image.height;
      this.frameSprite = new Sprite(new SpriteMaterial({ map: tex }));

      setCenter(this.frameSprite, 0, 0);
      this.frameSprite.position.set(Math.floor(-width / 2), Math.floor(CanvasSize * 2 / 3 - height), 1);
      this.frameSprite.scale.set(image.width, height, 1);

      scene.add(this.frameSprite);
    }

    const offset = Math.floor(time / 300) % f;
    this.frameSprite.material.map.offset.set(0, offset / f);
  }

  private constructSkeleton(isc: any) {
    const images = this.fetchImages();

    const bones = isc.bones.map((bone: any, i: number) => {
      const [, angle, sx, sy, tx, ty] = bone.transform;
      return {
        id: i,
        name: bone.name,
        tr: { angle, sx, sy, tx, ty },
        children: [] as any[]
      };
    });

    const skins = isc.skins.map((skin: any, i: number) => {
      const mesh = isc.meshs[skin.meshId];
      const image = images[mesh.imageId];
      const triangles = mesh.triangles.length > 0 ? mesh.triangles : [[0, 1, 2], [3, 4, 5]];
      const vertices = mesh.vertices.map((v: any) => {
        if (mesh.isSpring) {
          return {
            dst: v.dst.map(((p: any) => ({ boneId: p.boneId, ratio: p.ratio, v: vec2.fromValues(p.v[0], p.v[1]) }))),
            src: vec2.fromValues(v.src[0], v.src[1])
          }
        }
        return {
          dst: vec2.fromValues(v.dst[0], v.dst[1]),
          src: vec2.fromValues(v.src[0], v.src[1])
        }
      });;
      return {
        id: i,
        meshId: skin.meshId,
        skinName: skin.name,
        meshName: mesh.name,
        imageId: mesh.imageId,
        type: mesh.type,
        isSpring: mesh.isSpring,
        triangles, vertices
      };
    });

    for (const i of range(isc.bones.length)) {
      if (isc.bones[i].parent >= 0)
        bones[isc.bones[i].parent].children.push(bones[i]);
    }

    const slots = isc.slots
      .map((slot: any, i: number) => {
        const tint = ((slot.tint & 0xff) << 16) | (slot.tint & 0xff00) | ((slot.tint & 0xff0000) >> 16);

        return {
          slotId: i,
          bone: bones[slot.boneId],
          skin: skins[slot.skinId] || skins.find((skin: any) => skin.skinName === slot.skinName),
          tint,
          isAdditive: slot.flags === 1
        }
      })
      .filter((slot: any) => slot.skin);

    return { root: bones[0], slots };
  }

  private constructAnimation(isa: any) {
    function parseAnim(anim: any, type: string) {
      return {
        type,
        ...anim
      };
    }

    function createAnimState() {
      return {
        tr: { angle: 0, sx: 1, sy: 1, tx: 0, ty: 0 },
        color: null as number,
        opacity: 1,
        visible: true,
        offsets: [] as number[][],
        reset() {
          this.tr = { angle: 0, sx: 1, sy: 1, tx: 0, ty: 0 };
          this.color = null;
          this.opacity = 1;
          this.visible = true;
          this.offsets = [];
        }
      };
    }

    const animTypes = {
      bones: ['rotate', 'scale', 'translate'],
      slots: ['color', 'toggle'],
      meshs: ['points'],
    };

    const bones = isa.bones.map((bone: any, id: number) => {
      if (bone.anims.length === 0) return null;
      return {
        boneId: id,
        anims: bone.anims
          .map((anim: any, i: number) => anim && parseAnim(anim, animTypes.bones[i]))
          .filter(Boolean),
        state: createAnimState()
      };
    });

    const slots = isa.slots.map((slot: any, id: number) => {
      if (slot.anims.length === 0) return null;
      return {
        slotId: id,
        anims: slot.anims
          .map((anim: any, i: number) => anim && parseAnim(anim, animTypes.slots[i]))
          .filter(Boolean),
        state: createAnimState()
      };
    });

    const meshs = isa.meshs.map((mesh: any, id: number) => {
      if (mesh.anims.length === 0) return null;
      return {
        meshId: id,
        anims: mesh.anims
          .map((anim: any, i: number) => anim && parseAnim(anim, animTypes.meshs[i]))
          .filter(Boolean),
        state: createAnimState()
      };
    });

    return {
      bones, slots, meshs
    };
  }

  private updateAnimation(time: number) {
    const { bones, slots, meshs } = this.animation;
    const animations = flatMap([...bones, ...slots, ...meshs],
      elem => elem && elem.anims.map((anim: any) => ({ elem, anim }))
    ).filter(Boolean);

    function bezier(t: number, a: number, b: number, c: number, d: number) {
      return a * Math.pow(1 - t, 3) + (3 * b * Math.pow(1 - t, 2) + (3 * c * (1 - t) + d * t) * t) * t;
    }
    function bezierD(t: number, a: number, b: number, c: number, d: number) {
      return 3 * Math.pow(1 - t, 2) * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * t * t * (d - c);
    }

    function interpolate(a: number, b: number, time: number, aFrame: any, bFrame: any) {
      if (aFrame.interpolation === 'C' || bFrame === aFrame) return a;
      const duration = bFrame.time - aFrame.time;

      if (aFrame.interpolation === 'B') {
        const { b1, b2, b3, b4 } = aFrame;
        const x = (time - aFrame.time) / duration;

        let t = x;
        t -= (bezier(t, 0, b1, b3, 1) - x) / bezierD(t, 0, b1, b3, 1);
        t -= (bezier(t, 0, b1, b3, 1) - x) / bezierD(t, 0, b1, b3, 1);
        t -= (bezier(t, 0, b1, b3, 1) - x) / bezierD(t, 0, b1, b3, 1);
        t -= (bezier(t, 0, b1, b3, 1) - x) / bezierD(t, 0, b1, b3, 1);
        t -= (bezier(t, 0, b1, b3, 1) - x) / bezierD(t, 0, b1, b3, 1);
        return a + (b - a) * bezier(t, 0, b2, b4, 1);
      }
      if (aFrame.interpolation === 'L') {
        const t = (time - aFrame.time) / duration;
        return a + (b - a) * t;
      }
    }
    function interpolateP(a: [number, number], b: [number, number], time: number, aFrame: any, bFrame: any) {
      if (aFrame.interpolation === 'C' || bFrame === aFrame) return a;
      const duration = bFrame.time - aFrame.time;

      if (aFrame.interpolation === 'B') {
        const { b1, b2, b3, b4 } = aFrame;
        const t = (time - aFrame.time) / duration;
        return [bezier(t, a[0], b1, b3, b[0]), bezier(t, a[1], b2, b4, b[1])];
      }
      if (aFrame.interpolation === 'L') {
        const t = (time - aFrame.time) / duration;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
    }

    for (const { elem } of animations) {
      elem.state.reset();
    }

    const totalLength = max(animations.map(({ anim }) => anim.length));
    const animTime = time % totalLength;

    for (const { elem, anim } of animations) {
      const { length, frames } = anim;
      let nextFrameIndex = frames.findIndex((frame: any) => frame.time > animTime);
      if (nextFrameIndex < 0) nextFrameIndex = frames.length;

      const thisFrame = frames[(nextFrameIndex - 1 + frames.length) % frames.length];
      const nextFrame = frames[nextFrameIndex] || frames[0];
      switch (anim.type) {
        case 'rotate':
          elem.state.tr.angle += interpolate(thisFrame.angle, nextFrame.angle, animTime, thisFrame, nextFrame);
          break;
        case 'translate':
        case 'scale':
          const x = interpolate(thisFrame.v[0], nextFrame.v[0], animTime, thisFrame, nextFrame);
          const y = interpolate(thisFrame.v[1], nextFrame.v[1], animTime, thisFrame, nextFrame);
          if (anim.type === 'translate') {
            elem.state.tr.tx += x;
            elem.state.tr.ty += y;
          } else {
            elem.state.tr.sx *= x;
            elem.state.tr.sy *= y;
          }
          break;
        case 'color': {
          const opacity = interpolate(Math.floor(thisFrame.color / 0x1000000), Math.floor(nextFrame.color / 0x1000000), animTime, thisFrame, nextFrame);
          const color =
            (interpolate((thisFrame.color >> 16) & 0xff, (nextFrame.color >> 16) & 0xff, animTime, thisFrame, nextFrame) << 16) |
            (interpolate((thisFrame.color >> 8) & 0xff, (nextFrame.color >> 8) & 0xff, animTime, thisFrame, nextFrame) << 8) |
            (interpolate((thisFrame.color >> 0) & 0xff, (nextFrame.color >> 0) & 0xff, animTime, thisFrame, nextFrame) << 0);
          elem.state.opacity = opacity / 255;
          elem.state.color = color;
        } break;
        case 'toggle': {
          elem.state.visible = thisFrame.visible;
        } break;
        case 'points': {
          const thisPoints = thisFrame.points, nextPoints = nextFrame.points;
          for (const i of range(Math.max(thisPoints.length, nextPoints.length))) {
            const thisPoint = thisPoints[i] || [0, 0];
            const nextPoint = nextPoints[i] || [0, 0];
            elem.state.offsets.push(interpolateP(thisPoint, nextPoint, animTime, thisFrame, nextFrame));
          }
        } break;
      }
    }
  }

  private skeleton: any;
  private animation: any;
  private meshs: Mesh[];
  private updateSkeleton(canvas: HTMLCanvasElement, time: number) {
    const [isc, isa] = this.fetchMetadata();
    const images = this.fetchImages();
    if (!isc || !isa) return;

    if (!this.skeleton) {
      this.skeleton = this.constructSkeleton(isc);
    }
    if (!this.animation) {
      this.animation = this.constructAnimation(isa);
    }

    if (!this.scene) {
      const scene = this.createScene();
      this.meshs = [];

      const root = new Group();
      root.scale.set(1, -1, 1);
      root.translateY(Math.floor(CanvasSize * 2 / 3));
      scene.add(root);

      const texs = images.map(image => this.loadTex(image));

      for (const { skin, tint, isAdditive } of this.skeleton.slots) {
        const geom = new Geometry();
        const uvs: Vector2[] = [];
        for (const v of skin.vertices) {
          geom.vertices.push(new Vector3(0, 0, 1));
          uvs.push(new Vector2(v.src[0], v.src[1]));
        }

        geom.faceVertexUvs[0] = [];
        for (const f of skin.triangles) {
          const i = geom.faces.push(new Face3(f[0], f[1], f[2]));
          geom.faceVertexUvs[0].push([uvs[f[0]], uvs[f[1]], uvs[f[2]]]);
        }
        geom.uvsNeedUpdate = true;

        const mesh = new Mesh(geom, new MeshBasicMaterial({
          map: texs[skin.imageId],
          transparent: true,
          color: tint,
          side: DoubleSide,
          blending: isAdditive ? AdditiveBlending : NormalBlending
        }));
        root.add(mesh);
        this.meshs[skin.id] = mesh;
      }
    }

    this.updateAnimation(Math.round(time / 1000 * 30) / 30 + 0.001);

    const transforms: mat2d[] = [];
    const computeTransform = (bone: any, parent: mat2d) => {
      const transform = mat2d.clone(parent);

      const anim = this.animation.bones[bone.id] ?
        this.animation.bones[bone.id].state.tr :
        { angle: 0, sx: 1, sy: 1, tx: 0, ty: 0 };

      mat2d.translate(transform, transform, [bone.tr.tx + anim.tx, bone.tr.ty + anim.ty, 0]);
      mat2d.rotate(transform, transform, (bone.tr.angle + anim.angle) * Math.PI / 180);
      mat2d.scale(transform, transform, [bone.tr.sx * anim.sx, bone.tr.sy * anim.sy, 1]);

      transforms[bone.id] = transform;
      for (const child of bone.children)
        computeTransform(child, transform);
    }
    computeTransform(this.skeleton.root, mat2d.identity(mat2d.create()));

    const pt = vec2.create();
    const applyTransform = (boneId: number, meshId: number, i: number, v: vec2) => {
      vec2.copy(pt, v);

      if (this.animation.meshs[meshId]) {
        const offsets = this.animation.meshs[meshId].state.offsets;
        if (offsets[i]) {
          pt[0] += offsets[i][0];
          pt[1] += offsets[i][1];
        }
      }

      vec2.transformMat2d(pt, pt, transforms[boneId]);

      return pt;
    }

    for (const { slotId, bone, skin, tint } of this.skeleton.slots) {
      const mat = transforms[bone.id];
      const material = this.meshs[skin.id].material as MeshBasicMaterial;
      const geom = this.meshs[skin.id].geometry as Geometry;

      if (this.animation.slots[slotId]) {
        material.visible = this.animation.slots[slotId].state.visible;
        material.opacity = this.animation.slots[slotId].state.opacity;
      }

      for (const i of range(skin.vertices.length)) {
        if (skin.isSpring) {
          const t = vec2.create();
          for (const { boneId, v, ratio } of skin.vertices[i].dst) {
            vec2.scaleAndAdd(t, t, applyTransform(boneId, skin.meshId, i, v), ratio);
          }
          geom.vertices[i].set(t[0], t[1], 1);
        } else {
          const [x, y] = applyTransform(bone.id, skin.meshId, i, skin.vertices[i].dst);
          geom.vertices[i].set(x, y, 1);
        }
      }
      geom.verticesNeedUpdate = true;
    }
  }
}