"use server";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { playSession, userStats } from "@/db/schema";
import { getServerPuzzle, serverDayNumber, toPublicPuzzle, dateLabelForOffset } from "@/lib/puzzle.server";
import { getSessionUser } from "@/lib/session";
import { evaluate, CELLS, GUESSES, type Clue, type PublicPuzzle, type Puzzle } from "@/lib/engine";

const ANON_COOKIE = "nuance_anon";

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

// Resolve who is playing: a signed-in user, else a persistent anonymous cookie.
// Anonymous players are graded server-side too (so the recipe never ships to
// the browser) but never appear on the leaderboard.
async function resolveSubject(): Promise<{ type: "user" | "anon"; id: string }> {
  const user = await getSessionUser();
  if (user) return { type: "user", id: user.id };

  const jar = await cookies();
  let anon = jar.get(ANON_COOKIE)?.value;
  if (!anon) {
    anon = crypto.randomUUID();
    jar.set(ANON_COOKIE, anon, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return { type: "anon", id: anon };
}

function boardFrom(row: { guesses: string[][]; clues: Clue[][]; matchPercents: number[] }): SerializedGuess[] {
  return row.guesses.map((recipe, i) => ({
    recipe,
    clues: row.clues[i] ?? [],
    matchPercent: row.matchPercents[i] ?? 0,
  }));
}

async function ensureRow(subject: { type: string; id: string }, day: number) {
  await db
    .insert(playSession)
    .values({ subjectType: subject.type, subjectId: subject.id, day })
    .onConflictDoNothing({ target: [playSession.subjectType, playSession.subjectId, playSession.day] });
}

export async function loadGame(offset: number): Promise<LoadGameResult> {
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const puzzle = getServerPuzzle(safeOffset);
  const day = Number(puzzle.num);
  const subject = await resolveSubject();

  await ensureRow(subject, day);
  const [row] = await db
    .select()
    .from(playSession)
    .where(
      and(
        eq(playSession.subjectType, subject.type),
        eq(playSession.subjectId, subject.id),
        eq(playSession.day, day),
      ),
    );

  const status = (row?.status as GameStatus) ?? "composing";
  const finished = status !== "composing";

  return {
    puzzle: toPublicPuzzle(puzzle),
    board: row ? boardFrom(row) : [],
    status,
    isToday: safeOffset === 0,
    canGoBack: day > 1,
    dateLabel: dateLabelForOffset(safeOffset),
    recipe: finished ? puzzle.canonical : null,
  };
}

export async function submitGuess(offset: number, composition: string[]): Promise<SubmitGuessResult> {
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const puzzle = getServerPuzzle(safeOffset);
  const day = Number(puzzle.num);
  const isToday = safeOffset === 0 && day === serverDayNumber();
  const subject = await resolveSubject();

  // Validate the submission against the (public) palette before touching the DB.
  if (
    !Array.isArray(composition) ||
    composition.length !== CELLS ||
    !composition.every((id) => puzzle.palette.includes(id))
  ) {
    // Return the current state unchanged rather than recording garbage.
    return loadResult(subject, day, puzzle);
  }

  await ensureRow(subject, day);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(playSession)
      .where(
        and(
          eq(playSession.subjectType, subject.type),
          eq(playSession.subjectId, subject.id),
          eq(playSession.day, day),
        ),
      )
      .for("update");

    const status = (row.status as GameStatus) ?? "composing";
    if (status !== "composing" || row.guesses.length >= GUESSES) {
      // Already finished or full — no-op. Reveal recipe since it's over.
      return { board: boardFrom(row), status, recipe: status !== "composing" ? puzzle.canonical : null };
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

    // Record competitive stats only for signed-in players, only for today,
    // only once (the composing→finished transition), all inside this tx.
    if (finished && isToday && subject.type === "user") {
      await recordStats(tx, subject.id, day, newStatus === "won", guesses.length);
    }

    return {
      board: boardFrom({ guesses, clues, matchPercents }),
      status: newStatus,
      recipe: finished ? puzzle.canonical : null,
    };
  });
}

// Helper used when a submission is rejected: return the stored state.
async function loadResult(
  subject: { type: string; id: string },
  day: number,
  puzzle: Puzzle,
): Promise<SubmitGuessResult> {
  const [row] = await db
    .select()
    .from(playSession)
    .where(
      and(
        eq(playSession.subjectType, subject.type),
        eq(playSession.subjectId, subject.id),
        eq(playSession.day, day),
      ),
    );
  const status = (row?.status as GameStatus) ?? "composing";
  return {
    board: row ? boardFrom(row) : [],
    status,
    recipe: status !== "composing" ? puzzle.canonical : null,
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function recordStats(tx: Tx, userId: string, day: number, won: boolean, guesses: number) {
  const [stat] = await tx.select().from(userStats).where(eq(userStats.userId, userId)).for("update");
  const score = won ? guesses : 7; // a loss is one worse than the 6-guess max

  // Streak = consecutive days *played* (win or loss), based on today's day.
  let current: number;
  if (stat?.lastPlayDay === day) current = stat.currentStreak; // defensive: already counted
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

export interface MyStats {
  gamesPlayed: number;
  gamesWon: number;
  avgScore: number | null;
  currentStreak: number;
  maxStreak: number;
}

export async function getMyStats(): Promise<MyStats | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const [stat] = await db.select().from(userStats).where(eq(userStats.userId, user.id));
  if (!stat) return { gamesPlayed: 0, gamesWon: 0, avgScore: null, currentStreak: 0, maxStreak: 0 };
  return {
    gamesPlayed: stat.gamesPlayed,
    gamesWon: stat.gamesWon,
    avgScore: stat.gamesPlayed ? stat.totalScore / stat.gamesPlayed : null,
    currentStreak: stat.currentStreak,
    maxStreak: stat.maxStreak,
  };
}
