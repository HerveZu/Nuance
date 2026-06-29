import type { NextRequest } from "next/server";
import { resolveAnonSubject } from "@/auth/guards";
import { loadGame } from "@/game/service";
import { loadQuerySchema } from "@/game/schemas";
import { json, preflight } from "@/lib/api";

// Public, anonymous-only game API.
//
//   GET /api/game?offset=0&anonId=<optional>
//
// Loads (creating on first contact) the anonymous player's game for a given
// puzzle offset (0 = today). The response echoes `anonId` — pass it back via
// the `anonId` query param, the `X-Anon-Id` header, or the cookie we set to
// keep playing the same game. Anonymous play is graded server-side but never
// scores on the leaderboard.
//
// This API intentionally does not read sessions or expose the leaderboard;
// signed-in scoring stays on the first-party server-action path.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const parsed = loadQuerySchema.safeParse({
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
    anonId: req.nextUrl.searchParams.get("anonId") ?? undefined,
  });
  if (!parsed.success) {
    return json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { subject, anonId } = resolveAnonSubject(req, parsed.data.anonId);
  const result = await loadGame(subject, parsed.data.offset);
  return json({ anonId, ...result }, { anonId });
}

export function OPTIONS() {
  return preflight();
}
