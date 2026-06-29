"use server";

import { getSessionUser, resolveSubject } from "@/auth/guards";
import {
  getUserStats,
  type LoadGameResult,
  loadGame as loadGameCore,
  type MyStats,
  type SubmitGuessResult,
  submitGuess as submitGuessCore,
} from "@/game/service";

// First-party server actions for the web UI. They resolve the subject from the
// request (signed-in user, else anonymous cookie) and delegate to the
// transport-agnostic game core in @/game/service — the same core the public HTTP
// API uses. Signed-in players score on the leaderboard through this path.

export type {
  GameStatus,
  LoadGameResult,
  MyStats,
  SerializedGuess,
  SubmitGuessResult,
} from "@/game/service";

export async function loadGame(offset: number): Promise<LoadGameResult> {
  return loadGameCore(await resolveSubject(), offset);
}

export async function submitGuess(
  offset: number,
  composition: string[],
): Promise<SubmitGuessResult> {
  return submitGuessCore(await resolveSubject(), offset, composition);
}

export async function getMyStats(): Promise<MyStats | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return getUserStats(user.id);
}
