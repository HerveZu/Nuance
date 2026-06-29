import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/env";

// The origin better-auth signs cookies and builds OAuth callback URLs against.
// better-auth itself only reads BETTER_AUTH_URL, so we resolve Vercel's system
// env vars (auto-exposed, no protocol): an explicit BETTER_AUTH_URL wins (local
// dev / custom domain), then the stable production domain in production, then
// the per-deployment URL on preview builds. Returns undefined elsewhere so
// better-auth falls back to inferring the origin from the request.
function resolveBaseURL(): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return undefined;
}

// Trust the Vercel origins this app can be reached on so cross-origin auth
// requests aren't rejected when baseURL is the canonical production domain but
// the app is opened on a different deployment URL. The explicit production +
// per-deployment hosts cover the canonical cases; the `*.vercel.app` wildcard
// (better-auth matches it via wildcardMatch) also covers the git-branch and
// preview aliases, whose hostnames Vercel never exposes as env vars. Note this
// only satisfies better-auth's origin/callbackURL check — the OAuth redirect_uri
// is still built from baseURL and must be registered in the Discord app.
const trustedOrigins = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL]
  .filter((host): host is string => !!host)
  .map((host) => `https://${host}`);

if (env.VERCEL_ENV) trustedOrigins.push("https://*.vercel.app");

export const auth = betterAuth({
  baseURL: resolveBaseURL(),
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // No email-sending service wired up yet; revisit to require verification.
    requireEmailVerification: false,
  },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID ?? "",
      clientSecret: env.DISCORD_CLIENT_SECRET ?? "",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
