import { Deferred } from "app/utils/deferred";
import { Store } from "app/store";
import { Entry } from "app/database/image";
import { times, range, flatMap } from 'lodash';
import { vec2, mat4, mat2d } from 'gl-matrix';
import {
  WebGLRenderer, TextureLoader, Texture, Sprite,
  SpriteMaterial, Scene, OrthographicCamera, Vector2, Vector3, RepeatWrapping, Mesh, Geometry, Face3, MeshBasicMaterial, Group, DoubleSide, BoxBufferGeometry, PlaneGeometry
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
      const mat = mat2d.identity(mat2d.create());
      mat2d.scale(mat, mat, [sx, sy, 1]);
      mat2d.translate(mat, mat, [tx, ty, 0]);
      mat2d.rotate(mat, mat, angle * Math.PI / 180);
      return {
        id: i,
        name: bone.name,
        mat: mat,
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

    const slots = flatMap(isc.slots.filter((slot: any) => slot.skinId >= 0), (slot: any) => {
      const tint = ((slot.tint & 0xff) << 16) | (slot.tint & 0xff00) | ((slot.tint & 0xff0000) >> 16);
      const skin = skins[slot.skinId];

      return {
        bone: bones[slot.boneId],
        skin: skins[slot.skinId],
        tint,
        isMono: slot.flags === 1
      }
    });

    return { root: bones[0], slots };
  }

  private skeleton: any;
  private meshs: Mesh[];
  private updateSkeleton(canvas: HTMLCanvasElement, time: number) {
    const [isc, isa] = this.fetchMetadata();
    const images = this.fetchImages();
    if (!isc || !isa) return;

    if (!this.skeleton) {
      this.skeleton = this.constructSkeleton(isc);
    }

    if (!this.scene) {
      const scene = this.createScene();
      this.meshs = [];

      const root = new Group();
      root.scale.set(1, -1, 1);
      root.translateY(Math.floor(CanvasSize * 2 / 3));
      scene.add(root);

      const texs = images.map(image => this.loadTex(image));

      for (const { skin, tint, isMono } of this.skeleton.slots) {
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
        geom.computeFaceNormals();

        const mesh = new Mesh(geom, new MeshBasicMaterial({
          map: texs[skin.imageId],
          transparent: true,
          color: tint,
          alphaMap: isMono ? texs[skin.imageId] : null
        }));
        root.add(mesh);
        this.meshs[skin.id] = mesh;
      }
    }

    const transforms: mat2d[] = [];
    const computeTransform = (bone: any, parent: mat2d) => {
      const transform = mat2d.mul(mat2d.create(), parent, bone.mat);
      transforms[bone.id] = transform;
      for (const child of bone.children)
        computeTransform(child, transform);
    }
    computeTransform(this.skeleton.root, mat2d.identity(mat2d.create()));

    for (const { bone, skin, tint } of this.skeleton.slots) {
      const mat = transforms[bone.id];
      const geom = this.meshs[skin.id].geometry as Geometry;
      const pt = vec2.create();
      for (const i of range(skin.vertices.length)) {
        if (skin.isSpring) {
          const t = vec2.create();
          for (const { boneId, v, ratio } of skin.vertices[i].dst) {
            vec2.transformMat2d(pt, v, transforms[boneId]);
            vec2.scaleAndAdd(t, t, pt, ratio);
          }
          geom.vertices[i].set(t[0], t[1], 1);
        } else {
          const [x, y] = vec2.transformMat2d(pt, skin.vertices[i].dst, mat);
          geom.vertices[i].set(x, y, 1);
        }
      }
      geom.verticesNeedUpdate = true;
    }
  }
}