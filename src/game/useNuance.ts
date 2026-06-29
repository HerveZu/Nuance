"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  mix,
  CELLS,
  type BoardEntry,
  type PublicPuzzle,
  type Stats,
} from "@/game/engine";
import {
  loadGame,
  submitGuess,
  getMyStats,
  type LoadGameResult,
  type SerializedGuess,
  type MyStats,
} from "@/game/actions";
import { loadStats, saveStats, defaultStats } from "@/game/storage";
import { useSession } from "@/auth/auth-client";
import { KEY_CODES } from "@/game/keyboard";

type Status = "composing" | "won" | "lost";

export interface Nuance {
  ready: boolean;
  screen: "launch" | "play";
  puzzle: PublicPuzzle | null;
  composition: string[];
  board: BoardEntry[];
  status: Status;
  finished: boolean;
  pending: boolean;
  isToday: boolean;
  recipe: string[] | null;
  overlayOpen: boolean;
  signedIn: boolean;
  myStats: MyStats | null;
  anonStats: Stats;
  copied: boolean;
  dayOffset: number;
  canGoBack: boolean;
  dateLabel: string;
  addDose: (id: string) => void;
  removeDose: (i: number) => void;
  submit: () => void;
  startPlay: () => void;
  prevDay: () => void;
  nextDay: () => void;
  reopen: () => void;
  closeOverlay: () => void;
  share: (text: string) => void;
}

// Build a render-ready board entry from the server's grading. The mixed colour
// (rgb) and win flag are derived locally from the public weights + clues; only
// the clues themselves require the secret recipe, which the server provides.
function entryFrom(g: SerializedGuess, weights: number[]): BoardEntry {
  const rgb = mix(g.recipe, weights);
  const win = g.clues.length === CELLS && g.clues.every((c) => c === "green");
  return { recipe: g.recipe, fb: { matchPercent: g.matchPercent, clues: g.clues, deltaE: 0, win, rgb } };
}

const gameKey = (dayOffset: number, userId: string | null) => ["game", dayOffset, userId] as const;
const ANON_STATS_KEY = ["anonStats"] as const;

export function useNuance(): Nuance {
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const userId = session?.user?.id ?? null;
  const queryClient = useQueryClient();

  // Local UI state only (not server data): the selected day, the in-progress
  // composition, whether the player has entered the board, the results overlay,
  // and the share toast. Everything server-authoritative is TanStack Query.
  const [dayOffset, setDayOffset] = useState(0);
  const [composition, setComposition] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the per-day UI state when the day or signed-in identity changes —
  // done at render time (React's recommended pattern) rather than in an effect.
  const resetKey = `${dayOffset}:${userId}`;
  const [trackedKey, setTrackedKey] = useState(resetKey);
  if (trackedKey !== resetKey) {
    setTrackedKey(resetKey);
    setComposition([]);
    setStarted(false);
    setOverlayOpen(false);
    setCopied(false);
  }

  // Server-authoritative game state for the current day + identity. A change of
  // day or signed-in user is a new query key, so the switch is a refetch rather
  // than a manual reload; previous data stays on screen while the next loads.
  const gameQuery = useQuery({
    queryKey: gameKey(dayOffset, userId),
    queryFn: () => loadGame(dayOffset),
    placeholderData: keepPreviousData,
  });
  const data = gameQuery.data ?? null;
  const puzzle = data?.puzzle ?? null;
  const status: Status = data?.status ?? "composing";
  const recipe = data?.recipe ?? null;
  const board = useMemo<BoardEntry[]>(
    () => (data ? data.board.map((g) => entryFrom(g, data.puzzle.weights)) : []),
    [data],
  );
  const finished = status !== "composing";
  const screen: "launch" | "play" = board.length > 0 || started ? "play" : "launch";

  // The signed-in player's competitive stats for the results overlay.
  const myStatsQuery = useQuery({
    queryKey: ["myStats", userId],
    queryFn: getMyStats,
    enabled: signedIn,
  });
  const myStats = myStatsQuery.data ?? null;

  // Anonymous players keep a local (localStorage) stats aggregate, read through
  // the query cache so the results overlay updates without manual state.
  const anonStatsQuery = useQuery({
    queryKey: ANON_STATS_KEY,
    queryFn: () => loadStats(),
    enabled: !signedIn,
  });
  const anonStats = anonStatsQuery.data ?? defaultStats();

  const guessMutation = useMutation({
    mutationFn: (guess: string[]) => submitGuess(dayOffset, guess),
    onSuccess: (res) => {
      // The submission returns the authoritative new state — write it straight
      // into the cache instead of refetching the whole game.
      queryClient.setQueryData<LoadGameResult>(gameKey(dayOffset, userId), (old) =>
        old ? { ...old, board: res.board, status: res.status, recipe: res.recipe } : old,
      );
      setComposition([]);
      if (res.status !== "composing") {
        setOverlayOpen(true);
        if (signedIn) {
          void queryClient.invalidateQueries({ queryKey: ["myStats", userId] });
        } else if (data?.isToday && puzzle) {
          queryClient.setQueryData<Stats>(ANON_STATS_KEY, nextAnonStats(res.status === "won", res.board.length, Number(puzzle.num)));
        }
      }
    },
  });
  const { mutate: mutateGuess, isPending: pending } = guessMutation;

  // Current values readable from stable event handlers without re-binding them.
  const latest = useRef({ puzzle, composition, status, overlayOpen, screen, pending });
  useEffect(() => {
    latest.current = { puzzle, composition, status, overlayOpen, screen, pending };
  });

  const addDose = useCallback((id: string) => {
    if (latest.current.status !== "composing") return;
    setComposition((c) => (c.length >= CELLS ? c : [...c, id]));
  }, []);

  const removeDose = useCallback((i: number) => {
    if (latest.current.status !== "composing") return;
    setComposition((c) => c.filter((_, j) => j !== i));
  }, []);

  const submit = useCallback(() => {
    const cur = latest.current;
    if (cur.status !== "composing" || cur.composition.length !== CELLS || !cur.puzzle || cur.pending) return;
    mutateGuess(cur.composition.slice());
  }, [mutateGuess]);

  // Day 0 is today; positive offsets go back in time — never below 0, so the
  // player can never navigate into the future.
  const goToDay = useCallback((delta: number) => {
    setDayOffset((off) => Math.max(0, off + delta));
  }, []);

  const startPlay = useCallback(() => setStarted(true), []);
  const prevDay = useCallback(() => goToDay(1), [goToDay]);
  const nextDay = useCallback(() => goToDay(-1), [goToDay]);
  const reopen = useCallback(() => setOverlayOpen(true), []);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  const share = useCallback((text: string) => {
    try {
      void navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const cur = latest.current;
      if (cur.overlayOpen || !cur.puzzle) return;
      if (cur.screen === "launch") {
        if (e.key === "Enter") { e.preventDefault(); startPlay(); }
        return;
      }
      if (cur.status !== "composing") return;
      if (e.key === "Enter") { e.preventDefault(); submit(); return; }
      if (e.key === "Backspace") { e.preventDefault(); removeDose(cur.composition.length - 1); return; }
      const idx = KEY_CODES.indexOf(e.code);
      if (idx >= 0 && idx < cur.puzzle.palette.length) { e.preventDefault(); addDose(cur.puzzle.palette[idx]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addDose, removeDose, submit, startPlay]);

  return {
    ready: !!data,
    screen,
    puzzle,
    composition,
    board,
    status,
    finished,
    pending,
    isToday: data?.isToday ?? true,
    recipe,
    overlayOpen,
    signedIn,
    myStats,
    anonStats,
    copied,
    dayOffset,
    canGoBack: data?.canGoBack ?? false,
    dateLabel: data?.dateLabel ?? "TODAY",
    addDose,
    removeDose,
    submit,
    startPlay,
    prevDay,
    nextDay,
    reopen,
    closeOverlay,
    share,
  };
}

// Compute (and persist) the next anonymous stats aggregate after a finished
// game. Pure w.r.t. its inputs aside from the localStorage read/write.
function nextAnonStats(won: boolean, guesses: number, dayNum: number): Stats {
  const prev = loadStats();
  const s: Stats = { ...prev, distribution: (prev.distribution || [0, 0, 0, 0, 0, 0]).slice() };
  s.played = (s.played || 0) + 1;
  if (won) {
    s.wins = (s.wins || 0) + 1;
    s.distribution[guesses - 1] = (s.distribution[guesses - 1] || 0) + 1;
    s.currentStreak = s.lastWinDay === dayNum - 1 ? (s.currentStreak || 0) + 1 : 1;
    s.lastWinDay = dayNum;
  } else {
    s.currentStreak = 0;
  }
  s.maxStreak = Math.max(s.maxStreak || 0, s.currentStreak || 0);
  saveStats(s);
  return s;
}
