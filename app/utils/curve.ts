export interface Curve {
  min: number;
  max?: number;
  scale?: number;
}

export function computeValue(lv: number, maxLv: number, curve: Curve) {
  const f = ((Math.min(lv, maxLv) - 1) / (maxLv - 1)) || 1;
  return (curve.min) + ((curve.max || (curve.min * maxLv)) - (curve.min)) * Math.pow(f, (curve.scale || 1));
}