import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, userStats } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const avgExpr = sql<number>`${userStats.totalScore}::float / NULLIF(${userStats.gamesPlayed}, 0)`;

interface Row {
  id: string;
  name: string;
  image: string | null;
  avg: number;
  streak: number;
}

export default async function LeaderboardPage() {
  const me = await getSessionUser();

  const top = (await db
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
    .limit(100)) as Row[];

  // The signed-in player's own rank, even if they're outside the top 100.
  let myRank: number | null = null;
  let myRow: Row | null = null;
  if (me) {
    const [stat] = await db.select().from(userStats).where(eq(userStats.userId, me.id));
    if (stat && stat.gamesPlayed > 0) {
      const myAvg = stat.totalScore / stat.gamesPlayed;
      const [{ better }] = await db
        .select({ better: count() })
        .from(userStats)
        .where(and(gt(userStats.gamesPlayed, 0), sql`${userStats.totalScore}::float / ${userStats.gamesPlayed} < ${myAvg}`));
      myRank = Number(better) + 1;
      myRow = { id: me.id, name: me.name, image: me.image ?? null, avg: myAvg, streak: stat.currentStreak };
    }
  }

  const inTop = myRow != null && top.some((r) => r.id === myRow!.id);

  return (
    <div className="min-h-screen bg-ground text-ink font-ui p-4 md:p-5 md:pb-8">
      <div className="max-w-235 mx-auto w-full">
        <div className="flex items-center justify-between gap-4 pb-3 mb-5 flex-wrap">
          <div className="flex items-baseline gap-3.5 flex-wrap">
            <div className="font-display font-bold text-3xl tracking-[-0.03em]">LEADERBOARD</div>
            <div className="font-mono text-base text-sub tracking-[0.06em]">avg guesses · lower is better</div>
          </div>
          <Link
            href="/"
            className="font-mono border border-line rounded-card bg-transparent text-ink inline-flex items-center gap-1.5 px-3.5 py-[9px] text-sm uppercase tracking-[0.08em] hover:bg-surface"
          >
            <ArrowLeft size={15} /> Back to game
          </Link>
        </div>

        {top.length === 0 ? (
          <div className="border border-line rounded-card bg-surface p-10 text-center text-sub font-mono">
            No scores yet. Be the first — solve today&apos;s puzzle while signed in.
          </div>
        ) : (
          <div className="border border-line rounded-card bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 font-mono text-2xs uppercase tracking-[0.1em]">Rank</TableHead>
                  <TableHead className="font-mono text-2xs uppercase tracking-[0.1em]">Player</TableHead>
                  <TableHead className="text-right font-mono text-2xs uppercase tracking-[0.1em]">Avg</TableHead>
                  <TableHead className="text-right font-mono text-2xs uppercase tracking-[0.1em]">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((r, i) => (
                  <LeaderRow key={r.id} rank={i + 1} row={r} highlight={myRow?.id === r.id} />
                ))}
                {myRow && !inTop && myRank != null && (
                  <>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sub font-mono text-xs py-1">⋯</TableCell>
                    </TableRow>
                    <LeaderRow rank={myRank} row={myRow} highlight />
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderRow({ rank, row, highlight }: { rank: number; row: Row; highlight?: boolean }) {
  return (
    <TableRow className={highlight ? "bg-line/40" : undefined}>
      <TableCell className="font-mono tabular-nums text-sub">{rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 border border-line">
            {row.image && <AvatarImage src={row.image} alt={row.name} />}
            <AvatarFallback className="bg-ground text-ink font-mono text-2xs uppercase">
              {(row.name || "?").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium truncate max-w-[160px] md:max-w-[320px]">{row.name}</span>
          {highlight && <span className="font-mono text-2xs text-sub uppercase tracking-[0.08em]">you</span>}
        </div>
      </TableCell>
      <TableCell className="text-right font-display font-bold tabular-nums">{row.avg.toFixed(1)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{row.streak}</TableCell>
    </TableRow>
  );
}
