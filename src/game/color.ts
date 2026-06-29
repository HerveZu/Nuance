export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Oklch {
  L: number;
  C: number;
  H: number;
}

export function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

// RYB → RGB via trilinear interpolation between the eight cube corners of the
// painter's (red/yellow/blue) colour model.
const CORNERS: Record<string, [number, number, number]> = {
  i000: [1, 1, 1],
  i100: [1, 0, 0],
  i010: [1, 1, 0],
  i001: [0.163, 0.373, 0.6],
  i110: [1, 0.5, 0],
  i101: [0.5, 0, 0.5],
  i011: [0, 0.66, 0.2],
  i111: [0.2, 0.094, 0],
};

function lerp3(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function rybToRgb(r: number, y: number, b: number): RGB {
  const C = CORNERS;
  const c00 = lerp3(C.i000, C.i100, r);
  const c01 = lerp3(C.i001, C.i101, r);
  const c10 = lerp3(C.i010, C.i110, r);
  const c11 = lerp3(C.i011, C.i111, r);
  const c0 = lerp3(c00, c10, y);
  const c1 = lerp3(c01, c11, y);
  const o = lerp3(c0, c1, b);
  return { r: o[0], g: o[1], b: o[2] };
}

function lin(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgbToOklab(rgb: RGB) {
  const r = lin(clamp(rgb.r, 0, 1));
  const g = lin(clamp(rgb.g, 0, 1));
  const b = lin(clamp(rgb.b, 0, 1));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklch(rgb: RGB): Oklch {
  const o = rgbToOklab(rgb);
  let H = (Math.atan2(o.b, o.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: o.L, C: Math.hypot(o.a, o.b), H };
}

export function deltaE(a: RGB, b: RGB): number {
  const x = rgbToOklab(a),
    y = rgbToOklab(b);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

const HUEWHEEL: [number, string][] = [
  [29, "red"],
  [55, "orange"],
  [100, "yellow"],
  [125, "chartreuse"],
  [145, "green"],
  [165, "emerald"],
  [195, "cyan"],
  [230, "azure"],
  [265, "blue"],
  [300, "violet"],
  [330, "magenta"],
  [5, "rose"],
];

export function hueName(H: number): string {
  let best = "red",
    bd = 999;
  HUEWHEEL.forEach(([deg, name]) => {
    const dd = Math.abs(((H - deg + 540) % 360) - 180);
    if (dd < bd) {
      bd = dd;
      best = name;
    }
  });
  return best;
}

export function rgbToCss(rgb: RGB): string {
  const r = Math.round(clamp(rgb.r, 0, 1) * 255);
  const g = Math.round(clamp(rgb.g, 0, 1) * 255);
  const b = Math.round(clamp(rgb.b, 0, 1) * 255);
  return `rgb(${r},${g},${b})`;
}

export function fgFor(rgb: RGB): string {
  return rgbToOklab(rgb).L > 0.62 ? "#16130F" : "#FFFFFF";
}
