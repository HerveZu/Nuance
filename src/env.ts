import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Single source of truth for environment variables: validated once at startup
// so a missing/malformed value fails loudly here instead of surfacing as an
// undefined deep inside auth, the DB pool, or a route handler. Import `env`
// from here — never reach for `process.env` directly.
export const env = createEnv({
  server: {
    // Neon Postgres pooled connection string (see db/client).
    DATABASE_URL: z.url(),

    // better-auth reads these from process.env itself; we validate them here so
    // a broken auth config is caught at boot. The secret is mandatory; the URL
    // is optional because auth.ts can resolve it from Vercel system vars.
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().optional(),

    // Discord OAuth — optional so the app boots without social login wired up.
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),

    // Vercel system env vars (auto-exposed on deployments, absent locally).
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    VERCEL_URL: z.string().optional(),

    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  // No client-exposed (NEXT_PUBLIC_*) vars yet.
  client: {},
  experimental__runtimeEnv: {},

  // Treat an empty string as "unset" so a blank value in a .env file trips the
  // required-var checks instead of silently passing as a present-but-empty one.
  emptyStringAsUndefined: true,
});
