export interface Curve {
  min: number;
  max: number;
  scale: number;
}

export namespace Curve {
  export function valueAt(level: number, maxLevel: number, curve: Curve) {
    const f = level === maxLevel ? 1 : (Math.min(level, maxLevel) - 1) / (maxLevel - 1);
    return curve.min + (curve.max - curve.min) * Math.pow(f, curve.scale);
  }
}