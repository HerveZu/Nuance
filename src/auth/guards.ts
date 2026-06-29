import "server-only";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/auth/auth";
import { env } from "@/env";

// Next.js 16 renamed `middleware` to `proxy`, and its docs explicitly
// discourage using proxy as an auth/session layer (it runs at the network
// boundary and can't reliably share modules). The recommended pattern is to
// verify identity inside each route handler / server action — which is exactly
// what these composable guards provide.

const ANON_COOKIE = "nuance_anon";
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// A player is either a signed-in user or a persistent anonymous identity.
// Anonymous subjects are graded server-side just the same, but never score on
// the leaderboard (see recordStats in @/game/service).
export interface Subject {
  type: "user" | "anon";
  id: string;
}

// The signed-in user for the current request, or null. Used by server actions
// and the leaderboard page to decide what to record / highlight.
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// Resolve who is playing in a server-action / RSC context (where `cookies()`
// is writable): a signed-in user, else a persistent anonymous cookie that we
// issue on first contact.
export async function resolveSubject(): Promise<Subject> {
  const user = await getSessionUser();
  if (user) return { type: "user", id: user.id };

  const jar = await cookies();
  let anon = jar.get(ANON_COOKIE)?.value;
  if (!anon) {
    anon = crypto.randomUUID();
    jar.set(ANON_COOKIE, anon, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: ANON_COOKIE_MAX_AGE,
    });
  }
  return { type: "anon", id: anon };
}

// Resolve an anonymous subject for the public HTTP API. The API is
// anonymous-only by design — it never reads sessions and never touches the
// leaderboard — so the caller's identity is just a stable id we can read back
// from (in priority order) the `X-Anon-Id` header, an explicit value (e.g. a
// JSON body field), the `?anonId=` query param, or the `nuance_anon` cookie.
// When none is present we mint one; the route echoes `anonId` (and sets the
// cookie) so a headless integration can persist its own game across calls.
export function resolveAnonSubject(
  req: NextRequest,
  explicitId?: string | null,
): { subject: Subject; anonId: string; isNew: boolean } {
  const fromHeader = req.headers.get("x-anon-id");
  const fromQuery = req.nextUrl.searchParams.get("anonId");
  const fromCookie = req.cookies.get(ANON_COOKIE)?.value;
  const existing = explicitId || fromHeader || fromQuery || fromCookie || null;
  const anonId = existing ?? crypto.randomUUID();
  return { subject: { type: "anon", id: anonId }, anonId, isNew: !existing };
}

export { ANON_COOKIE, ANON_COOKIE_MAX_AGE };

// Guard for user-scoped route handlers: respond 401 unless signed in. Provided
// for reuse / future authenticated endpoints (the current game API is
// anonymous-only and does not use it).
type UserHandler<Ctx> = (
  req: NextRequest,
  ctx: Ctx,
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
) => Response | Promise<Response>;

export function withUser<Ctx>(handler: UserHandler<Ctx>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    const user = await getSessionUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, ctx, user);
  };
}
