import { vec2 } from "gl-matrix";

export type Triangle = [number, number, number];

export interface SpineTransform {
  angle: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
}

export interface MeshVertex {
  dst: vec2 | { boneId: number, ratio: number, v: vec2 }[],
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
  id: number,
  name: string;
  meshId: number;
  meshName: string;

  imageId: number;
  isSpring: boolean;
  triangles: Triangle[];
  vertices: MeshVertex[];
  animation: {
    timelines: Timeline[];
    offsets: [number, number][];
  };
}

export interface Slot {
  slotId: number,
  bone: Bone,
  skin: Skin,
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
  const FPS = 30;

  function bezier(t: number, a: number, b: number, c: number, d: number) {
    return a * Math.pow(1 - t, 3) + (3 * b * Math.pow(1 - t, 2) + (3 * c * (1 - t) + d * t) * t) * t;
  }

  function bezierD(t: number, a: number, b: number, c: number, d: number) {
    return 3 * Math.pow(1 - t, 2) * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * t * t * (d - c);
  }

  function solveBezier(x: number, a: number, b: number) {
    let t = x;
    t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
    t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
    t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
    t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
    t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1)
    return t;
  }

  export function updateAnimation(anim: SpineAnimation, time: number) {
    const noFrame = Math.round(time / 1000 * FPS);
    const animTime = (noFrame / FPS + 0.0001) % anim.length;
    let thisFrame: KeyFrame, nextFrame: KeyFrame;

    for (const bone of anim.bones) {
      bone.animation.transform.angle = 0;
      bone.animation.transform.sx = 1;
      bone.animation.transform.sy = 1;
      bone.animation.transform.tx = 0;
      bone.animation.transform.ty = 0;
      for (const timeline of bone.animation.timelines)
        updateTimeline(timeline, bone.animation);
    }

    for (const slot of anim.slots) {
      slot.animation.tint = 0xffffffff;
      for (const timeline of slot.animation.timelines)
        updateTimeline(timeline, slot.animation);

      const skin = slot.skin;
      skin.animation.offsets.length = 0;
      for (const timeline of skin.animation.timelines)
        updateTimeline(timeline, skin.animation);
    }

    function interpolate(a: number, b: number) {
      const duration = nextFrame.time - thisFrame.time;
      if (duration === 0) return a;

      switch (thisFrame.interpolation) {
        case 'C':
          return a;
        case 'L':
          return a + (b - a) * (animTime - thisFrame.time) / duration;
        case 'B': {
          const { b1, b2, b3, b4 } = thisFrame as KeyFrameBezier;
          return a + (b - a) * bezier(solveBezier((animTime - thisFrame.time) / duration, b1, b3), 0, b2, b4, 1);
        }
      }
    }

    function interpolateP(a: [number, number], b: [number, number]) {
      const duration = nextFrame.time - thisFrame.time;
      if (duration === 0) return a;

      const t = (animTime - thisFrame.time) / duration;
      switch (thisFrame.interpolation) {
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

    function updateTimeline(timeline: Timeline, state: any) {
      const { length, frames } = timeline;
      let nextFrameIndex = frames.findIndex((frame: any) => frame.time > animTime);
      if (nextFrameIndex < 0) nextFrameIndex = frames.length;

      thisFrame = frames[(nextFrameIndex - 1 + frames.length) % frames.length];
      nextFrame = frames[nextFrameIndex] || frames[0];
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
          const thisPoints: [number, number][] = (thisFrame as any).points;
          const nextPoints: [number, number][] = (nextFrame as any).points;
          const numPoints = Math.max(thisPoints.length, nextPoints.length);
          for (let i = 0; i < numPoints; i++) {
            const thisPoint = thisPoints[i] || [0, 0];
            const nextPoint = nextPoints[i] || [0, 0];
            state.offsets.push(interpolateP(thisPoint, nextPoint));
          }
        } break;
      }
    }
  }
}