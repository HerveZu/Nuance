import { NextResponse } from "next/server";
import { ANON_COOKIE, ANON_COOKIE_MAX_AGE } from "@/auth/guards";
import { env } from "@/env";

// Helpers for the public HTTP API (src/app/api/game). Per the Next.js 16
// route-handler docs, CORS is configured per route handler — these helpers
// keep that consistent across the game endpoints so integrations on other
// origins can call them.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Anon-Id",
  "Access-Control-Max-Age": "86400",
};

// JSON response with CORS headers. When `anonId` is supplied we also drop the
// `nuance_anon` cookie so browser-based callers keep the same anonymous game
// across requests without having to echo the id themselves.
export function json(data: unknown, opts: { status?: number; anonId?: string } = {}): NextResponse {
  const res = NextResponse.json(data, { status: opts.status ?? 200, headers: CORS_HEADERS });
  if (opts.anonId) {
    res.cookies.set(ANON_COOKIE, opts.anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: ANON_COOKIE_MAX_AGE,
    });
  }
  return res;
}

// Preflight handler — re-export as `OPTIONS` from each route file.
export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
