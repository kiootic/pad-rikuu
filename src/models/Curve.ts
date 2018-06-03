export interface Curve {
  min: number;
  max: number;
  scale: number;
}

export namespace Curve {
  export function valueAt(level: number, maxLevel: number, curve: Curve) {
    const f = maxLevel === 1 ? 1 : (level - 1) / (maxLevel - 1);
    return curve.min + (curve.max - curve.min) * Math.pow(f, curve.scale);
  }
}