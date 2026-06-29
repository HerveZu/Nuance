import "server-only";
import { and, eq } from "drizzle-orm";
import type { Subject } from "@/auth/guards";
import { db } from "@/db/client";
import { playSession, userStats } from "@/db/schema";
import { type Clue, evaluate, GUESSES, type PublicPuzzle } from "@/game/engine";
import {
  dateLabelForOffset,
  getServerPuzzle,
  serverDayNumber,
  toPublicPuzzle,
} from "@/game/puzzle.server";
import { offsetSchema, puzzleCompositionSchema } from "@/game/schemas";

// Transport-agnostic game core. Every function takes an explicit `subject` and
// never reads cookies/headers, so it can be driven equally by the first-party
// server actions (@/game/actions) and the public HTTP API (src/app/api/game).
// The secret recipe is held here and only revealed once a game is finished.

export interface SerializedGuess {
  recipe: string[];
  clues: Clue[];
  matchPercent: number;
}

export type GameStatus = "composing" | "won" | "lost";

export interface LoadGameResult {
  puzzle: PublicPuzzle;
  board: SerializedGuess[];
  status: GameStatus;
  isToday: boolean;
  canGoBack: boolean;
  dateLabel: string;
  recipe: string[] | null; // revealed only once the game is finished
}

export interface SubmitGuessResult {
  board: SerializedGuess[];
  status: GameStatus;
  recipe: string[] | null;
}

export interface MyStats {
  gamesPlayed: number;
  gamesWon: number;
  avgScore: number | null;
  currentStreak: number;
  maxStreak: number;
}

// Clamp to a non-future puzzle. The server clock alone decides "today", so a
// negative or malformed offset can never reach a future day — it falls back to
// today. (The HTTP API rejects such input with 400 before reaching here; this
// is the last-line guarantee for any caller.)
function normalizeOffset(offset: number): number {
  return offsetSchema.catch(0).parse(offset);
}

function boardFrom(row: {
  guesses: string[][];
  clues: Clue[][];
  matchPercents: number[];
}): SerializedGuess[] {
  return row.guesses.map((recipe, i) => ({
    recipe,
    clues: row.clues[i] ?? [],
    matchPercent: row.matchPercents[i] ?? 0,
  }));
}

async function ensureRow(subject: Subject, day: number) {
  await db
    .insert(playSession)
    .values({ subjectType: subject.type, subjectId: subject.id, day })
    .onConflictDoNothing({
      target: [playSession.subjectType, playSession.subjectId, playSession.day],
    });
}

function rowWhere(subject: Subject, day: number) {
  return and(
    eq(playSession.subjectType, subject.type),
    eq(playSession.subjectId, subject.id),
    eq(playSession.day, day),
  );
}

export async function loadGame(subject: Subject, offset: number): Promise<LoadGameResult> {
  const off = normalizeOffset(offset);
  const puzzle = getServerPuzzle(off);
  const day = Number(puzzle.num);

  await ensureRow(subject, day);
  const [row] = await db.select().from(playSession).where(rowWhere(subject, day));

  const status = (row?.status as GameStatus) ?? "composing";
  const finished = status !== "composing";

  return {
    puzzle: toPublicPuzzle(puzzle),
    board: row ? boardFrom(row) : [],
    status,
    isToday: off === 0,
    canGoBack: day > 1,
    dateLabel: dateLabelForOffset(off),
    recipe: finished ? puzzle.canonical : null,
  };
}

export async function submitGuess(
  subject: Subject,
  offset: number,
  composition: string[],
): Promise<SubmitGuessResult> {
  const off = normalizeOffset(offset);
  const puzzle = getServerPuzzle(off);
  const day = Number(puzzle.num);
  // Only the current daily puzzle counts on the leaderboard, and the server
  // clock is the sole authority for which day that is — the client's offset
  // cannot make a past (or future) puzzle score. Past days are still graded
  // and saved for free play; they just never touch user_stats.
  const isScored = day === serverDayNumber();

  // Validate the submission against the day's palette before touching the DB.
  // Return the current state unchanged rather than recording garbage.
  if (!puzzleCompositionSchema(puzzle.palette).safeParse(composition).success) {
    await ensureRow(subject, day);
    const [row] = await db.select().from(playSession).where(rowWhere(subject, day));
    const status = (row?.status as GameStatus) ?? "composing";
    return {
      board: row ? boardFrom(row) : [],
      status,
      recipe: status !== "composing" ? puzzle.canonical : null,
    };
  }

  await ensureRow(subject, day);

  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(playSession).where(rowWhere(subject, day)).for("update");

    const status = (row.status as GameStatus) ?? "composing";
    if (status !== "composing" || row.guesses.length >= GUESSES) {
      // Already finished or full — no-op. Reveal recipe since it's over.
      return {
        board: boardFrom(row),
        status,
        recipe: status !== "composing" ? puzzle.canonical : null,
      };
    }

    const fb = evaluate(composition, puzzle);
    const guesses = [...row.guesses, composition];
    const clues = [...row.clues, fb.clues];
    const matchPercents = [...row.matchPercents, fb.matchPercent];
    const newStatus: GameStatus = fb.win ? "won" : guesses.length >= GUESSES ? "lost" : "composing";
    const finished = newStatus !== "composing";

    await tx
      .update(playSession)
      .set({
        guesses,
        clues,
        matchPercents,
        status: newStatus,
        completedAt: finished ? new Date() : null,
      })
      .where(eq(playSession.id, row.id));

    // Record competitive stats only for signed-in players, only for the
    // server's current daily puzzle, only once (the composing→finished
    // transition), all inside this tx.
    if (finished && isScored && subject.type === "user") {
      await recordStats(tx, subject.id, day, newStatus === "won", guesses.length);
    }

    return {
      board: boardFrom({ guesses, clues, matchPercents }),
      status: newStatus,
      recipe: finished ? puzzle.canonical : null,
    };
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function recordStats(tx: Tx, userId: string, day: number, won: boolean, guesses: number) {
  const [stat] = await tx
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .for("update");
  const score = won ? guesses : 7; // a loss is one worse than the 6-guess max

  // Streak = consecutive days *played* (win or loss), based on today's day.
  let current: number;
  if (stat?.lastPlayDay === day)
    current = stat.currentStreak; // defensive: already counted
  else if (stat?.lastPlayDay === day - 1) current = (stat?.currentStreak ?? 0) + 1;
  else current = 1;

  if (!stat) {
    await tx.insert(userStats).values({
      userId,
      gamesPlayed: 1,
      gamesWon: won ? 1 : 0,
      totalScore: score,
      currentStreak: current,
      maxStreak: current,
      lastPlayDay: day,
      updatedAt: new Date(),
    });
    return;
  }

  if (stat.lastPlayDay === day) return; // already recorded today

  await tx
    .update(userStats)
    .set({
      gamesPlayed: stat.gamesPlayed + 1,
      gamesWon: stat.gamesWon + (won ? 1 : 0),
      totalScore: stat.totalScore + score,
      currentStreak: current,
      maxStreak: Math.max(stat.maxStreak, current),
      lastPlayDay: day,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));
}

export async function getUserStats(userId: string): Promise<MyStats> {
  const [stat] = await db.select().from(userStats).where(eq(userStats.userId, userId));
  if (!stat) return { gamesPlayed: 0, gamesWon: 0, avgScore: null, currentStreak: 0, maxStreak: 0 };
  return {
    gamesPlayed: stat.gamesPlayed,
    gamesWon: stat.gamesWon,
    avgScore: stat.gamesPlayed ? stat.totalScore / stat.gamesPlayed : null,
    currentStreak: stat.currentStreak,
    maxStreak: stat.maxStreak,
  };
}
