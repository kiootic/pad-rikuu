import { vec2 } from 'gl-matrix';
import { maxBy, range } from 'lodash';

/* tslint:disable:no-bitwise */

export type Triangle = [number, number, number];

export interface SpineTransform {
  angle: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
}

export interface MeshVertex {
  dst: vec2 | Array<{ boneId: number, ratio: number, v: vec2 }>;
  src: vec2;
}

export interface Bone {
  id: number;
  name: string;
  transform: SpineTransform;
  animation: {
    timelines: Timeline[];
    transform: SpineTransform;
  };
  children: Bone[];
}

export interface Skin {
  id: number;
  name: string;
  meshId: number;
  meshName: string;

  imageId: number;
  isSpring: boolean;
  triangles: Triangle[];
  vertices: MeshVertex[];
  animation: {
    timelines: Timeline[];
    offsets: Array<[number, number]>;
  };
}

export interface Slot {
  slotId: number;
  bone: Bone;
  skin: Skin;
  tint: number;
  animation: {
    timelines: Timeline[];
    tint: number;
  };
  isAdditive: boolean;
}

export enum TimelineType {
  Rotate = 'rotate',
  Translate = 'translate',
  Scale = 'scale',
  Tint = 'tint',
  Toggle = 'toggle',
  Offset = 'offset'
}

export interface Timeline {
  type: TimelineType;
  length: number;
  frames: KeyFrame[];
}

export interface KeyFrame {
  interpolation: string;
  time: number;
}

export interface KeyFrameBezier extends KeyFrame {
  b1: number;
  b2: number;
  b3: number;
  b4: number;
}

export interface SpineAnimation {
  bones: Bone[];
  slots: Slot[];
  length: number;
}

export namespace SpineAnimation {
  const animTypes: Record<string, TimelineType[]> = {
    bones: [TimelineType.Rotate, TimelineType.Scale, TimelineType.Translate],
    slots: [TimelineType.Tint, TimelineType.Toggle],
    meshs: [TimelineType.Offset],
  };

  export function parseAnimation(isc: DataISC, isa: DataISA): SpineAnimation {
    let animLength = 0;
    function parseTimelines(type: string, anims: Timeline[]) {
      const timelines = anims.map((anim: any, i: number): Timeline => anim && {
        type: animTypes[type][i],
        ...anim
      }).filter(Boolean);
  
      if (timelines.length > 0)
        animLength = Math.max(animLength, maxBy(timelines, timeline => timeline.length)!.length);
  
      return timelines;
    }
  
    const bones = isc.bones.map((bone, i): Bone => {
      const [, angle, sx, sy, tx, ty] = bone.transform;
      return {
        id: i,
        name: bone.name,
        transform: { angle, sx, sy, tx, ty },
        animation: {
          timelines: isa.bones[i] ? parseTimelines('bones', isa.bones[i].anims) : [],
          transform: { angle: 0, sx: 1, sy: 1, tx: 0, ty: 0 }
        },
        children: [] as Bone[]
      };
    });
  
    for (const i of range(isc.bones.length)) {
      if (isc.bones[i].parent >= 0)
        bones[isc.bones[i].parent].children.push(bones[i]);
    }
  
    const skins = isc.skins.map((skin, i): Skin => {
      const mesh = isc.meshs[skin.meshId];
      const triangles: Triangle[] = mesh.triangles.length > 0 ? mesh.triangles : [[0, 1, 2], [3, 4, 5]];
      const vertices = mesh.vertices.map((v): MeshVertex => {
        if (mesh.isSpring) {
          return {
            dst: v.dst.map((p => ({ boneId: p.boneId, ratio: p.ratio, v: vec2.fromValues(p.v[0], p.v[1]) }))),
            src: vec2.fromValues(v.src[0], v.src[1])
          };
        } else {
          return {
            dst: vec2.fromValues(v.dst[0], v.dst[1]),
            src: vec2.fromValues(v.src[0], v.src[1])
          };
        }
      });
  
      return {
        id: i,
        name: skin.name,
        meshId: skin.meshId,
        meshName: mesh.name,
        imageId: mesh.imageId,
        isSpring: mesh.isSpring,
        animation: {
          timelines: isa.meshs[i] ? parseTimelines('meshs', isa.meshs[i].anims) : [],
          offsets: []
        },
        triangles,
        vertices
      };
    });
  
    const slots = isc.slots.map((slot, i): Slot => {
      const tint = ((slot.tint & 0xff) << 16) | (slot.tint & 0xff00) | ((slot.tint & 0xff0000) >> 16);
      return {
        slotId: i,
        bone: bones[slot.boneId],
        skin: skins[slot.skinId] || skins.find(skin => skin.name === slot.skinName),
        tint,
        animation: {
          timelines: isa.slots[i] ? parseTimelines('slots', isa.slots[i].anims) : [],
          tint: 0xffffffff
        },
        isAdditive: slot.flags === 1
      };
    }).filter(slot => !!slot.skin);
  
    return { bones, slots, length: animLength };
  }  

  interface DataISC {
    bones: Array<{
      name: string;
      parent: number;
      transform: number[];
    }>;
    skins: Array<{
      name: string;
      meshId: number;
    }>;
    slots: Array<{
      flags: number;
      tint: number;
      boneId: number;
      skinId: number;
      skinName: string;
    }>;
    meshs: Array<{
      name: string;
      imageId: number;
      isSpring: boolean;
      triangles: Triangle[];
      vertices: Array<{ src: number[], dst: any[] }>;
    }>;
  }

  interface DataISA {
    bones: Array<{ anims: Timeline[] }>;
    slots: Array<{ anims: Timeline[] }>;
    meshs: Array<{ anims: Timeline[] }>;
  }
}