import "server-only";
import type { Puzzle, PublicPuzzle } from "@/lib/engine";
import { dailyPuzzle, dateForOffset, dayNumber } from "@/lib/daily";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The full puzzle for a navigation offset (0 = today). Includes the secret
// `canonical` recipe — NEVER return this object directly to the client.
export function getServerPuzzle(offset: number): Puzzle {
  return dailyPuzzle(dateForOffset(offset));
}

// Today's day number, decided by the server clock — the single source of truth
// for which puzzle is "today" and therefore scores on the leaderboard.
export function serverDayNumber(): number {
  return dayNumber(dateForOffset(0));
}

// Strip the secret recipe before sending to the browser.
export function toPublicPuzzle(p: Puzzle): PublicPuzzle {
  const { canonical: _canonical, ...pub } = p;
  void _canonical;
  return pub;
}

export function dateLabelForOffset(offset: number): string {
  if (offset === 0) return "TODAY";
  const d = dateForOffset(offset);
  return MONTHS[d.getMonth()] + " " + d.getDate();
}
