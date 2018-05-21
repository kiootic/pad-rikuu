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
import { SpineAnimation, Bone, Skin } from "app/data/spineAnim";
import { parseAnimation } from "app/parser/spineAnim";

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

  private animation: SpineAnimation;
  private meshs: Mesh[];
  private updateSkeleton(canvas: HTMLCanvasElement, time: number) {
    const [isc, isa] = this.fetchMetadata();
    const images = this.fetchImages();
    if (!isc || !isa) return;

    if (!this.animation) {
      this.animation = parseAnimation(isc, isa);
    }

    if (!this.scene) {
      const scene = this.createScene();
      this.meshs = [];

      const root = new Group();
      root.scale.set(1, -1, 1);
      root.translateY(Math.floor(CanvasSize * 2 / 3));
      scene.add(root);

      const texs = images.map(image => this.loadTex(image));

      for (const { skin, tint, isAdditive } of this.animation.slots) {
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

    SpineAnimation.updateAnimation(this.animation, time);

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
    }
    computeTransform(this.animation.bones[0], mat2d.identity(mat2d.create()));

    const pt = vec2.create();
    const applyTransform = (boneId: number, skin: Skin, i: number, v: vec2) => {
      vec2.copy(pt, v);

      const offsets = skin.animation.offsets;
      if (offsets[i]) {
        pt[0] += offsets[i][0];
        pt[1] += offsets[i][1];
      }

      vec2.transformMat2d(pt, pt, transforms[boneId]);

      return pt;
    }

    for (const { bone, skin, tint, animation } of this.animation.slots) {
      const material = this.meshs[skin.id].material as MeshBasicMaterial;
      const geom = this.meshs[skin.id].geometry as Geometry;

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
          const [x, y] = applyTransform(bone.id, skin, i, dst);
          geom.vertices[i].set(x, y, 1);
        }
      }
      geom.verticesNeedUpdate = true;
    }
  }
}