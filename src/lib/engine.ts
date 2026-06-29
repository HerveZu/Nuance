import { clamp, rybToRgb, deltaE, type RGB } from "./color";

export interface Pigment {
  id: string;
  name: string;
  code: string;
  ryb: [number, number, number];
  fam: string;
}

export type Clue = "green" | "yellow" | "grey" | "none";

export interface Feedback {
  matchPercent: number;
  clues: Clue[];
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
  weights: number[];
  theme: Theme;
  num: number | string;
}

// The puzzle shape that is safe to send to the browser: everything except the
// secret `canonical` recipe. The client renders the palette/target/weights and
// can preview its own mixes from these, but can never read the answer.
export type PublicPuzzle = Omit<Puzzle, "canonical">;

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

export const GUESSES = 6;
// The recipe is an ordered row of cells. Order matters because each cell
// carries its own weight in the mix — a per-day value of 1..9. A heavy cell
// dominates the blend; a light one barely tints it.
export const CELLS = 5;

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

export function getPigment(id: string): Pigment {
  return PMAP[id];
}

export function mix(recipe: string[], weights: number[]): RGB {
  let r = 0, y = 0, b = 0, wsum = 0;
  recipe.forEach((id, i) => {
    const w = weights[i] ?? 0;
    const c = PMAP[id].ryb;
    r += c[0] * w;
    y += c[1] * w;
    b += c[2] * w;
    wsum += w;
  });
  const n = wsum || 1;
  return rybToRgb(r / n, y / n, b / n);
}

const UNIT_WEIGHTS = Array(CELLS).fill(1);

// A single pigment blended with itself is that pigment regardless of weights,
// so the pure swatch is weight-agnostic.
export function pureMix(id: string): RGB {
  return mix(Array(CELLS).fill(id), UNIT_WEIGHTS);
}

function matchPercent(dE: number): number {
  const d = clamp(dE / 0.5, 0, 1);
  return Math.round(100 * Math.pow(1 - d, 1.6));
}

export function evaluate(guess: string[], puzzle: Puzzle): Feedback {
  // Per-cell clues: green = right pigment in the right cell; yellow = right
  // pigment but in the wrong cell; grey = pigment not in the recipe. Resolved
  // Mastermind-style so each recipe cell can satisfy only one guess cell.
  const code = puzzle.canonical;
  const clues: Clue[] = guess.map(() => "grey");
  const used = code.map(() => false);
  guess.forEach((g, i) => {
    if (code[i] === g) { clues[i] = "green"; used[i] = true; }
  });
  guess.forEach((g, i) => {
    if (clues[i] === "green") return;
    const j = code.findIndex((c, k) => !used[k] && c === g);
    if (j >= 0) { clues[i] = "yellow"; used[j] = true; }
  });
  const rgb = mix(guess, puzzle.weights);
  const dE = deltaE(rgb, puzzle.target);
  const mp = matchPercent(dE);
  // Solved only when every cell matches the recipe exactly (all green), not
  // merely when the blended colour lands close to the target.
  const win = clues.length === CELLS && clues.every((c) => c === "green");
  return { matchPercent: mp, clues, deltaE: dE, win, rgb };
}

export function recipeText(canonical: string[], weights: number[]): string {
  return canonical
    .map((id, i) => weights[i] + "× " + PMAP[id].name)
    .join("  ·  ");
}

export function buildShareText(board: BoardEntry[], puzzle: Pick<Puzzle, "num">, won: boolean): string {
  const rows = board.map((b) => {
    const squares = b.fb.clues.map((c) => (
      c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬜"
    )).join("");
    return squares + "  " + b.fb.matchPercent + "%";
  });
  return "Nuance #" + puzzle.num + "  " + (won ? board.length : "X") + "/" + GUESSES + "\n" + rows.join("\n");
}
