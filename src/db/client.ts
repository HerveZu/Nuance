import "server-only";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

// WebSocket pool (not the one-shot `neon()` http client) so multi-statement
// transactions work — grading a guess and updating the leaderboard stats must
// commit atomically. Reuse a single pool across the serverless runtime.
const globalForDb = globalThis as unknown as { _nuancePool?: Pool };

export const pool =
  globalForDb._nuancePool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb._nuancePool = pool;

export const db = drizzle(pool, { schema });
