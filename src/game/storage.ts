import type { Stats } from "./engine";

const STATS_KEY = "nuance.stats";
const DAILY_KEY = "nuance.daily";

export interface DailyState {
  date: string;
  size: number;
  board: string[][];
  status: string;
}

export function defaultStats(): Stats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    lastWinDay: null,
  };
}

export function loadStats(): Stats {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) || "null");
    if (s) return s;
  } catch {}
  return defaultStats();
}

export function saveStats(s: Stats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {}
}

export function loadDaily(): DailyState | null {
  try {
    return JSON.parse(localStorage.getItem(DAILY_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveDaily(date: string, size: number, board: string[][], status: string): void {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify({ date, size, board, status }));
  } catch {}
}
