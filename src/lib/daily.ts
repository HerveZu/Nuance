import { POOL, CELLS, mix, pureMix, type Theme, type Puzzle } from "./engine";
import { oklch, deltaE, type RGB } from "./color";

const MIN_PALETTE_DIST = 0.03;
const EPOCH = Date.UTC(2026, 1, 8);

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
  { title: "SEA GLASS", sub: "Soft greens and cyans, washed pale.", weights: { green: 4, blue: 4, yellow: 1 }, neutralsMax: 2, size: [11, 14] },
  { title: "AUTUMN", sub: "Earths, ochre and rust turning over.", weights: { earth: 4, orange: 3, red: 3, yellow: 2 }, neutralsMax: 1, size: [13, 16] },
  { title: "NOCTURNE", sub: "Blues and violets sinking into black.", weights: { blue: 4, violet: 3, magenta: 1 }, neutralsMax: 1, size: [10, 13] },
  { title: "CITRUS", sub: "Bright yellows, oranges and lime.", weights: { yellow: 4, orange: 3, green: 2 }, neutralsMax: 1, size: [9, 12] },
  { title: "ROSE GARDEN", sub: "Reds and pinks with a leaf of green.", weights: { red: 3, magenta: 3, violet: 1, green: 1 }, neutralsMax: 1, size: [11, 14] },
  { title: "MEADOW", sub: "Fresh greens and yellows under open sky.", weights: { green: 4, yellow: 3, earth: 1, blue: 1 }, neutralsMax: 1, size: [13, 16] },
  { title: "TROPICAL", sub: "Vivid cyan, green and magenta, no muting.", weights: { green: 3, blue: 3, magenta: 2, orange: 2 }, neutralsMax: 0, size: [11, 14] },
  { title: "GLACIER", sub: "Pale blues and ice, barely tinted.", weights: { blue: 4, green: 2, violet: 1 }, neutralsMax: 2, size: [10, 13] },
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

// Each cell gets a distinct weight, drawn from 1..6 (no duplicates), so the
// four cells always pull on the mix by different amounts.
function genWeights(rng: () => number): number[] {
  return shuffle([1, 2, 3, 4, 5, 6], rng).slice(0, CELLS);
}

function genRecipe(rng: () => number, palette: string[], weights: number[]): { recipe: string[]; target: RGB } {
  for (let n = 0; n < 500; n++) {
    const distinct = Math.min(rng() < 0.45 ? 2 : 3, palette.length);
    const chosen = shuffle(palette, rng).slice(0, distinct);
    const doses = chosen.slice();
    while (doses.length < CELLS) doses.push(chosen[Math.floor(rng() * chosen.length)]);
    // Shuffle so the heaviest cell isn't always the first-picked pigment.
    const recipe = shuffle(doses, rng);
    const target = mix(recipe, weights);
    const lch = oklch(target);
    if (lch.L > 0.92 && lch.C < 0.04) continue;
    if (lch.L < 0.12) continue;
    return { recipe, target };
  }
  const d = shuffle(palette, rng).slice(0, 2);
  while (d.length < CELLS) d.push(d[0]);
  const recipe = shuffle(d, rng);
  return { recipe, target: mix(recipe, weights) };
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
  const weights = genWeights(rng);
  const r = genRecipe(rng, palette, weights);
  return {
    palette,
    target: r.target,
    canonical: r.recipe,
    weights,
    theme,
    num: dayNumber(date),
  };
}
