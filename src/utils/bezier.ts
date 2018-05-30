export function bezier(t: number, a: number, b: number, c: number, d: number) {
  return a * Math.pow(1 - t, 3) + (3 * b * Math.pow(1 - t, 2) + (3 * c * (1 - t) + d * t) * t) * t;
}

export function bezierD(t: number, a: number, b: number, c: number, d: number) {
  return 3 * Math.pow(1 - t, 2) * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * t * t * (d - c);
}

export function solveBezier(x: number, a: number, b: number) {
  let t = x;
  t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
  t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
  t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
  t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
  t -= (bezier(t, 0, a, b, 1) - x) / bezierD(t, 0, a, b, 1);
  return t;
}