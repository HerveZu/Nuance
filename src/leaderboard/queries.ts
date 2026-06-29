import "server-only";
import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { user, userStats } from "@/db/schema";

// Ranked by average guesses-to-solve (lower is better; a loss counts as 7).
const avgExpr = sql<number>`${userStats.totalScore}::float / NULLIF(${userStats.gamesPlayed}, 0)`;

export interface LeaderRow {
  id: string;
  name: string;
  image: string | null;
  avg: number;
  streak: number;
}

export async function getLeaderboard(limit = 100): Promise<LeaderRow[]> {
  return (await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      avg: avgExpr,
      streak: userStats.currentStreak,
    })
    .from(userStats)
    .innerJoin(user, eq(user.id, userStats.userId))
    .where(gt(userStats.gamesPlayed, 0))
    .orderBy(asc(avgExpr), desc(userStats.currentStreak))
    .limit(limit)) as LeaderRow[];
}

// The signed-in player's own row and global rank, even if outside the top 100.
export async function getMyLeaderboardRow(me: {
  id: string;
  name: string;
  image?: string | null;
}): Promise<{ rank: number; row: LeaderRow } | null> {
  const [stat] = await db.select().from(userStats).where(eq(userStats.userId, me.id));
  if (!stat || stat.gamesPlayed === 0) return null;
  const myAvg = stat.totalScore / stat.gamesPlayed;
  const [{ better }] = await db
    .select({ better: count() })
    .from(userStats)
    .where(
      and(
        gt(userStats.gamesPlayed, 0),
        sql`${userStats.totalScore}::float / ${userStats.gamesPlayed} < ${myAvg}`,
      ),
    );
  return {
    rank: Number(better) + 1,
    row: { id: me.id, name: me.name, image: me.image ?? null, avg: myAvg, streak: stat.currentStreak },
  };
}
