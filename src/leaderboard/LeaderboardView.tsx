import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSessionUser } from "@/auth/guards";
import { gameButtonVariants } from "@/components/ui/buttons";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageShell } from "@/components/ui/PageShell";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Surface } from "@/components/ui/Surface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLeaderboard, getMyLeaderboardRow, type LeaderRow } from "@/leaderboard/queries";
import { cn } from "@/lib/utils";

export default async function LeaderboardView() {
  const me = await getSessionUser();
  const top = await getLeaderboard(100);

  const mine = me ? await getMyLeaderboardRow(me) : null;
  const myRow = mine?.row ?? null;
  const inTop = myRow != null && top.some((r) => r.id === myRow.id);

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4 pb-3 mb-5 flex-wrap">
        <PageHeading title="LEADERBOARD" caption="avg guesses · lower is better" />
        <Link
          href="/"
          className={cn(
            gameButtonVariants({ variant: "ghost", size: "pill" }),
            "inline-flex items-center gap-1.5 hover:bg-surface",
          )}
        >
          <ArrowLeft size={15} /> Back to game
        </Link>
      </div>

      {top.length === 0 ? (
        <Surface className="p-10 text-center text-sub font-mono">
          No scores yet. Be the first — solve today&apos;s puzzle while signed in.
        </Surface>
      ) : (
        <Surface className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-label">Rank</TableHead>
                <TableHead className="text-label">Player</TableHead>
                <TableHead className="text-right text-label">Avg</TableHead>
                <TableHead className="text-right text-label">Streak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((r, i) => (
                <LeaderRowItem key={r.id} rank={i + 1} row={r} highlight={myRow?.id === r.id} />
              ))}
              {myRow && !inTop && mine && (
                <>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sub font-mono text-xs py-1">
                      ⋯
                    </TableCell>
                  </TableRow>
                  <LeaderRowItem rank={mine.rank} row={myRow} highlight />
                </>
              )}
            </TableBody>
          </Table>
        </Surface>
      )}
    </PageShell>
  );
}

function LeaderRowItem({
  rank,
  row,
  highlight,
}: {
  rank: number;
  row: LeaderRow;
  highlight?: boolean;
}) {
  return (
    <TableRow className={highlight ? "bg-line/40" : undefined}>
      <TableCell className="font-mono tabular-nums text-sub">{rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <PlayerAvatar
            name={row.name}
            image={row.image}
            className="h-7 w-7"
            fallbackClassName="bg-ground text-2xs"
          />
          <span className="font-medium truncate max-w-40 md:max-w-[320px]">{row.name}</span>
          {highlight && <span className="text-meta uppercase tracking-wide">you</span>}
        </div>
      </TableCell>
      <TableCell className="text-right font-display font-bold tabular-nums">
        {row.avg.toFixed(1)}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">{row.streak}</TableCell>
    </TableRow>
  );
}
