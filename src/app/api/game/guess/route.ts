import type { NextRequest } from "next/server";
import { resolveAnonSubject } from "@/auth/guards";
import { submitGuess } from "@/game/service";
import { guessRequestSchema } from "@/game/schemas";
import { json, preflight } from "@/lib/api";

// Public, anonymous-only game API.
//
//   POST /api/game/guess
//   { "offset": 0, "composition": ["R","Y",...], "anonId": "<optional>" }
//
// Submits one guess for the anonymous player's game. The composition is graded
// against the secret recipe server-side; the response carries the updated
// board, status, and the revealed recipe once the game is finished. As with
// GET, anonymous play never scores on the leaderboard.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = guessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { offset, composition, anonId: bodyAnon } = parsed.data;
  const { subject, anonId } = resolveAnonSubject(req, bodyAnon ?? null);
  const result = await submitGuess(subject, offset, composition);
  return json({ anonId, ...result }, { anonId });
}

export function OPTIONS() {
  return preflight();
}
