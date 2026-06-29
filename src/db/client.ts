import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";
import { env } from "@/env";

// WebSocket pool (not the one-shot `neon()` http client) so multi-statement
// transactions work — grading a guess and updating the leaderboard stats must
// commit atomically. Reuse a single pool across the serverless runtime.
const globalForDb = globalThis as unknown as { _nuancePool?: Pool };

export const pool = globalForDb._nuancePool ?? new Pool({ connectionString: env.DATABASE_URL });

if (env.NODE_ENV !== "production") globalForDb._nuancePool = pool;

export const db = drizzle(pool, { schema });
