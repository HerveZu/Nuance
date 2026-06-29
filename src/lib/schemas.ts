import { z } from "zod";
import { CELLS } from "@/lib/engine";

// Parsing/validation schemas for game input, shared by the public HTTP API and
// the game core. All request parsing goes through zod rather than ad-hoc checks.

// offset: 0 = today, a positive integer = that many days into the past. Never
// negative — a caller must not be able to target a *future* puzzle. The server
// clock is the sole authority for which day is "today" (see lib/game.ts).
export const offsetSchema = z.coerce.number().int().min(0);

// Shape of a guess: exactly CELLS positional pigment ids. Per-puzzle palette
// membership is checked by `puzzleCompositionSchema` once the day is known.
const compositionShape = z.array(z.string()).length(CELLS);

export const loadQuerySchema = z.object({
  offset: offsetSchema.default(0),
  anonId: z.string().min(1).optional(),
});

export const guessRequestSchema = z.object({
  offset: offsetSchema.default(0),
  composition: compositionShape,
  anonId: z.string().min(1).optional(),
});

// A guess validated against a specific day's palette: CELLS ids, each one a
// pigment that actually appears in the puzzle's palette.
export function puzzleCompositionSchema(palette: string[]) {
  const allowed = new Set(palette);
  return z.array(z.string().refine((id) => allowed.has(id))).length(CELLS);
}
