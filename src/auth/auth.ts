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

// Trust the Vercel origins this app can be reached on (preview + production) so
// cross-origin auth requests aren't rejected when baseURL is the canonical
// production domain but the app is opened on a preview deployment URL.
const trustedOrigins = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL]
  .filter((host): host is string => !!host)
  .map((host) => `https://${host}`);

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
