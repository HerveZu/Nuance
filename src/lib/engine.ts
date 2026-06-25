export interface Pigment {
  id: string;
  name: string;
  code: string;
  ryb: [number, number, number];
  fam: string;
}

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

export type Clue = "green" | "yellow" | "grey" | "none";

export interface Feedback {
  matchPercent: number;
  clues: Record<string, Clue>;
  deltaE: number;
  win: boolean;
  rgb: RGB;
}

export interface Theme {
  title: string;
  sub: string;
}

export interface Puzzle {
  palette: string[];
  target: RGB;
  canonical: string[];
  theme: Theme;
  num: number | string;
}

export interface BoardEntry {
  recipe: string[];
  fb: Feedback;
}

export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  lastWinDay: number | null;
}

export const WIN_PCT = 96;
export const GUESSES = 6;
export const DOSES = 6;

const MIN_PALETTE_DIST = 0.03;

const EPOCH = Date.UTC(2026, 1, 8);

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

export const POOL: Pigment[] = [
  { id: "R", name: "Vermilion", code: "VRM-01", ryb: [1, 0, 0], fam: "red" },
  { id: "CDR", name: "Cadmium Red", code: "CDR-02", ryb: [1, 0.12, 0], fam: "red" },
  { id: "CR", name: "Carmine", code: "CAR-03", ryb: [1, 0, 0.15], fam: "red" },
  { id: "CRM", name: "Crimson", code: "CRM-04", ryb: [1, 0, 0.28], fam: "red" },
  { id: "SCR", name: "Scarlet", code: "SCR-05", ryb: [1, 0.2, 0], fam: "red" },
  { id: "ROS", name: "Rose Madder", code: "ROS-06", ryb: [1, 0, 0.38], fam: "magenta" },
  { id: "MG", name: "Magenta", code: "MAG-07", ryb: [1, 0, 0.5], fam: "magenta" },
  { id: "VI", name: "Cobalt Violet", code: "VIO-08", ryb: [0.6, 0, 0.8], fam: "violet" },
  { id: "DOX", name: "Dioxazine", code: "DOX-09", ryb: [0.5, 0, 0.92], fam: "violet" },
  { id: "MAU", name: "Mauve", code: "MAU-10", ryb: [0.55, 0.05, 0.7], fam: "violet" },
  { id: "CDO", name: "Cadmium Orange", code: "CDO-11", ryb: [0.9, 0.6, 0], fam: "orange" },
  { id: "ORG", name: "Bright Orange", code: "ORG-12", ryb: [1, 0.45, 0], fam: "orange" },
  { id: "Y", name: "Naples Yellow", code: "JNP-13", ryb: [0, 1, 0], fam: "yellow" },
  { id: "CDY", name: "Cadmium Yellow", code: "CDY-14", ryb: [0.12, 1, 0], fam: "yellow" },
  { id: "LEM", name: "Lemon Yellow", code: "LEM-15", ryb: [0, 1, 0.12], fam: "yellow" },
  { id: "OC", name: "Yellow Ochre", code: "OCR-16", ryb: [0.25, 1, 0.1], fam: "earth" },
  { id: "GLD", name: "Gold Ochre", code: "GLD-17", ryb: [0.4, 0.9, 0.15], fam: "earth" },
  { id: "TS", name: "Raw Sienna", code: "TDS-18", ryb: [0.7, 0.6, 0.3], fam: "earth" },
  { id: "BSN", name: "Burnt Sienna", code: "BSN-19", ryb: [0.85, 0.4, 0.2], fam: "earth" },
  { id: "RUM", name: "Raw Umber", code: "RUM-20", ryb: [0.6, 0.6, 0.5], fam: "earth" },
  { id: "BUM", name: "Burnt Umber", code: "BUM-21", ryb: [0.72, 0.5, 0.45], fam: "earth" },
  { id: "VR", name: "Veronese Green", code: "VER-22", ryb: [0, 0.85, 0.45], fam: "green" },
  { id: "SAP", name: "Sap Green", code: "SAP-23", ryb: [0.1, 0.8, 0.55], fam: "green" },
  { id: "OLV", name: "Olive Green", code: "OLV-24", ryb: [0.25, 0.85, 0.4], fam: "green" },
  { id: "VIR", name: "Viridian", code: "VIR-25", ryb: [0, 0.72, 0.7], fam: "green" },
  { id: "EMR", name: "Emerald", code: "EMR-26", ryb: [0, 0.78, 0.6], fam: "green" },
  { id: "B", name: "Ultramarine", code: "OUT-27", ryb: [0, 0, 1], fam: "blue" },
  { id: "COB", name: "Cobalt Blue", code: "COB-28", ryb: [0, 0.1, 0.95], fam: "blue" },
  { id: "CE", name: "Cerulean", code: "CER-29", ryb: [0, 0.22, 0.9], fam: "blue" },
  { id: "PRU", name: "Prussian Blue", code: "PRU-30", ryb: [0.12, 0.3, 0.85], fam: "blue" },
  { id: "CYA", name: "Cyan", code: "CYA-31", ryb: [0, 0.4, 0.85], fam: "blue" },
  { id: "W", name: "Titanium White", code: "BTI-32", ryb: [0, 0, 0], fam: "white" },
  { id: "K", name: "Ivory Black", code: "NDI-33", ryb: [1, 1, 1], fam: "black" },
];

const PMAP: Record<string, Pigment> = {};
POOL.forEach((p) => {
  PMAP[p.id] = p;
});

const HUEWHEEL: [number, string][] = [
  [29, "red"], [55, "orange"], [100, "yellow"], [125, "chartreuse"],
  [145, "green"], [165, "emerald"], [195, "cyan"], [230, "azure"],
  [265, "blue"], [300, "violet"], [330, "magenta"], [5, "rose"],
];

export function getPigment(id: string): Pigment {
  return PMAP[id];
}

export function clueIcon(clue: Clue): string {
  return clue === "green" ? "✓" : clue === "yellow" ? "↕" : "";
}

function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

function lerp3(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rybToRgb(r: number, y: number, b: number): RGB {
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

export function mix(recipe: string[]): RGB {
  let r = 0, y = 0, b = 0;
  recipe.forEach((id) => {
    const c = PMAP[id].ryb;
    r += c[0];
    y += c[1];
    b += c[2];
  });
  const n = recipe.length || 1;
  return rybToRgb(r / n, y / n, b / n);
}

export function pureMix(id: string): RGB {
  return mix(Array(DOSES).fill(id));
}

function lin(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab(rgb: RGB) {
  const r = lin(clamp(rgb.r, 0, 1));
  const g = lin(clamp(rgb.g, 0, 1));
  const b = lin(clamp(rgb.b, 0, 1));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
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

function deltaE(a: RGB, b: RGB): number {
  const x = rgbToOklab(a), y = rgbToOklab(b);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

function matchPercent(dE: number): number {
  const d = clamp(dE / 0.5, 0, 1);
  return Math.round(100 * Math.pow(1 - d, 1.6));
}

export function hueName(H: number): string {
  let best = "red", bd = 999;
  HUEWHEEL.forEach(([deg, name]) => {
    const dd = Math.abs(((H - deg + 540) % 360) - 180);
    if (dd < bd) { bd = dd; best = name; }
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

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const PURE: Record<string, RGB> = {};
POOL.forEach((p) => {
  PURE[p.id] = pureMix(p.id);
});

const FAMILIES = ["red", "magenta", "violet", "orange", "yellow", "earth", "green", "blue"];
const BY_FAM: Record<string, string[]> = {};
POOL.forEach((p) => {
  if (p.fam === "white" || p.fam === "black") return;
  (BY_FAM[p.fam] ||= []).push(p.id);
});

interface Archetype {
  title: string;
  sub: string;
  weights: Record<string, number>;
  neutralsMax: number;
  size: [number, number];
}

// Each day draws one archetype, which biases family selection (and palette
// size) so the daily palette has a distinct character instead of every day
// sampling the same broad spread of the pool.
const ARCHETYPES: Archetype[] = [
  { title: "WARM SPECTRUM", sub: "Reds and yellows run hot.", weights: { red: 4, orange: 3, yellow: 3, magenta: 2, earth: 2 }, neutralsMax: 1, size: [13, 17] },
  { title: "COOL FRONT", sub: "Blues and greens lead the wheel.", weights: { blue: 4, green: 3, violet: 3, magenta: 1 }, neutralsMax: 2, size: [12, 15] },
  { title: "THE EARTHS", sub: "Grounded, muted territory.", weights: { earth: 5, orange: 2, yellow: 2, red: 2, green: 1 }, neutralsMax: 1, size: [12, 16] },
  { title: "SUNSET", sub: "Warm analogous — reds melting into gold.", weights: { red: 4, orange: 4, yellow: 3, magenta: 3 }, neutralsMax: 1, size: [11, 13] },
  { title: "FOREST & SKY", sub: "Greens and blues, leaf to horizon.", weights: { green: 4, blue: 3, yellow: 2, earth: 3 }, neutralsMax: 1, size: [13, 16] },
  { title: "JEWEL BOX", sub: "Deep, saturated violets, blues and greens.", weights: { violet: 3, blue: 3, magenta: 3, green: 2, red: 2 }, neutralsMax: 1, size: [12, 15] },
  { title: "BRUISED VIOLETS", sub: "Violets and magentas, low and moody.", weights: { violet: 4, magenta: 3, blue: 2, red: 2 }, neutralsMax: 1, size: [11, 14] },
  { title: "PURE PIGMENT", sub: "No white, no black — shift hue to lighten or shade.", weights: { red: 2, orange: 2, yellow: 2, green: 2, blue: 2, violet: 2, magenta: 1, earth: 1 }, neutralsMax: 0, size: [12, 15] },
  { title: "FULL WHEEL", sub: "A broad spread across the spectrum.", weights: { red: 2, orange: 2, yellow: 2, green: 2, blue: 2, violet: 2, magenta: 2, earth: 2 }, neutralsMax: 2, size: [16, 20] },
];

function weightedPick(fams: string[], weights: Record<string, number>, rng: () => number): string {
  let total = 0;
  for (const f of fams) total += weights[f] || 0;
  let r = rng() * total;
  for (const f of fams) {
    r -= weights[f] || 0;
    if (r <= 0) return f;
  }
  return fams[fams.length - 1];
}

function pickDailyPalette(rng: () => number): { palette: string[]; theme: Theme } {
  const arch = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)];
  const size = arch.size[0] + Math.floor(rng() * (arch.size[1] - arch.size[0] + 1));

  const picked: string[] = [];
  const used = new Set<string>();
  const tryAdd = (id: string): boolean => {
    if (used.has(id)) return false;
    if (!picked.every((p) => deltaE(PURE[p], PURE[id]) >= MIN_PALETTE_DIST)) return false;
    picked.push(id);
    used.add(id);
    return true;
  };

  // White/black count varies day to day, capped by the archetype.
  const neutrals = shuffle(["W", "K"], rng);
  const neutralCount = Math.floor(rng() * (arch.neutralsMax + 1));
  for (let i = 0; i < neutralCount; i++) tryAdd(neutrals[i]);

  // Chromatic pigments drawn family-by-family, weighted toward the archetype.
  const pool: Record<string, string[]> = {};
  let active = FAMILIES.filter((f) => arch.weights[f] && BY_FAM[f]);
  active.forEach((f) => { pool[f] = shuffle(BY_FAM[f], rng); });
  // Only ever draw from the archetype's families — if they run dry before
  // reaching the target size the palette simply ends up smaller, keeping each
  // day's mood pure rather than diluting it with off-theme colours.
  let guard = 0;
  while (picked.length < size && active.length && guard++ < 3000) {
    const fam = weightedPick(active, arch.weights, rng);
    const fp = pool[fam];
    while (fp.length && !tryAdd(fp.shift()!)) { /* skip near-identical pigments */ }
    if (!fp.length) active = active.filter((f) => f !== fam);
  }

  return { palette: picked, theme: { title: arch.title, sub: arch.sub } };
}

function genRecipe(rng: () => number, palette: string[]): { recipe: string[]; target: RGB } {
  for (let n = 0; n < 500; n++) {
    const distinct = Math.min(rng() < 0.45 ? 2 : 3, palette.length);
    const chosen = shuffle(palette, rng).slice(0, distinct);
    const doses = chosen.slice();
    while (doses.length < DOSES) doses.push(chosen[Math.floor(rng() * chosen.length)]);
    const target = mix(doses);
    const lch = oklch(target);
    if (lch.L > 0.92 && lch.C < 0.04) continue;
    if (lch.L < 0.12) continue;
    return { recipe: doses, target };
  }
  const d = shuffle(palette, rng).slice(0, 2);
  while (d.length < DOSES) d.push(d[0]);
  return { recipe: d, target: mix(d) };
}

function hashDate(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function dayNumber(d: Date): number {
  const u = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((u - EPOCH) / 86400000);
}

export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

export function dateForOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d;
}

export function dailyPuzzle(date: Date): Puzzle {
  const rng = mulberry32(hashDate(date));
  const { palette, theme } = pickDailyPalette(rng);
  const r = genRecipe(rng, palette);
  return {
    palette,
    target: r.target,
    canonical: r.recipe,
    theme,
    num: dayNumber(date),
  };
}

function countMap(rec: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  rec.forEach((p) => { m[p] = (m[p] || 0) + 1; });
  return m;
}

export function evaluate(guess: string[], puzzle: Puzzle): Feedback {
  const gc = countMap(guess), tc = countMap(puzzle.canonical);
  const clues: Record<string, Clue> = {};
  puzzle.palette.forEach((id) => {
    const g = gc[id] || 0, t = tc[id] || 0;
    if (g === 0) clues[id] = "none";
    else if (g === t) clues[id] = "green";
    else if (t > 0) clues[id] = "yellow";
    else clues[id] = "grey";
  });
  const rgb = mix(guess);
  const dE = deltaE(rgb, puzzle.target);
  const mp = matchPercent(dE);
  return { matchPercent: mp, clues, deltaE: dE, win: mp >= WIN_PCT, rgb };
}

export function recipeText(canonical: string[]): string {
  const cc = countMap(canonical);
  return Object.keys(cc)
    .sort((a, b) => cc[b] - cc[a])
    .map((id) => cc[id] + "× " + PMAP[id].name)
    .join("  ·  ");
}

export function buildShareText(board: BoardEntry[], puzzle: Puzzle, won: boolean): string {
  const rows = board.map((b) => {
    const sorted = b.recipe.slice().sort((x, y) => puzzle.palette.indexOf(x) - puzzle.palette.indexOf(y));
    const squares = sorted.map((id) => {
      const c = b.fb.clues[id];
      return c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬜";
    }).join("");
    return squares + "  " + b.fb.matchPercent + "%";
  });
  return "Nuance #" + puzzle.num + "  " + (won ? board.length : "X") + "/" + GUESSES + "\n" + rows.join("\n");
}
