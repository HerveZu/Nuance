"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mix,
  CELLS,
  type BoardEntry,
  type PublicPuzzle,
  type Stats,
} from "@/lib/engine";
import { loadGame, submitGuess, getMyStats, type SerializedGuess, type MyStats } from "@/app/actions";
import { loadStats, saveStats, defaultStats } from "@/lib/storage";
import { useSession } from "@/lib/auth-client";
import { KEY_CODES } from "@/lib/keyboard";

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

export function useNuance(): Nuance {
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const userId = session?.user?.id ?? null;

  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"launch" | "play">("launch");
  const [dayOffset, setDayOffset] = useState(0);
  const [puzzle, setPuzzle] = useState<PublicPuzzle | null>(null);
  const [composition, setComposition] = useState<string[]>([]);
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [status, setStatus] = useState<Status>("composing");
  const [recipe, setRecipe] = useState<string[] | null>(null);
  const [isToday, setIsToday] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [dateLabel, setDateLabel] = useState("TODAY");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [anonStats, setAnonStats] = useState<Stats>(defaultStats);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latest = useRef({ dayOffset, puzzle, composition, board, status, overlayOpen, screen, isToday });
  useEffect(() => {
    latest.current = { dayOffset, puzzle, composition, board, status, overlayOpen, screen, isToday };
  });

  const applyLoad = useCallback((offset: number) => {
    setPending(true);
    loadGame(offset)
      .then((res) => {
        setPuzzle(res.puzzle);
        setBoard(res.board.map((g) => entryFrom(g, res.puzzle.weights)));
        setStatus(res.status);
        setRecipe(res.recipe);
        setIsToday(res.isToday);
        setCanGoBack(res.canGoBack);
        setDateLabel(res.dateLabel);
        setComposition([]);
        setCopied(false);
        setOverlayOpen(false);
        setScreen(res.board.length ? "play" : "launch");
        setReady(true);
      })
      .finally(() => setPending(false));
  }, []);

  // Load (or reload) whenever the day or the signed-in identity changes — a
  // different subject has a different server-side game.
  useEffect(() => {
    // Synchronising React with the server-authoritative game state — a
    // deliberate fetch on day / identity change, not a render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyLoad(dayOffset);
  }, [dayOffset, userId, applyLoad]);

  // Keep the signed-in player's competitive stats fresh for the results overlay.
  const refreshStats = useCallback(() => {
    if (!signedIn) {
      setMyStats(null);
      setAnonStats(loadStats());
      return;
    }
    getMyStats().then(setMyStats);
  }, [signedIn]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStats();
  }, [refreshStats]);

  const addDose = useCallback((id: string) => {
    const { status: st, composition: comp } = latest.current;
    if (st !== "composing" || comp.length >= CELLS) return;
    setComposition((c) => [...c, id]);
  }, []);

  const removeDose = useCallback((i: number) => {
    if (latest.current.status !== "composing") return;
    setComposition((c) => c.filter((_, j) => j !== i));
  }, []);

  const submit = useCallback(() => {
    const { status: st, composition: comp, dayOffset: off, puzzle: pz, isToday: today } = latest.current;
    if (st !== "composing" || comp.length !== CELLS || !pz || pending) return;
    setPending(true);
    const guess = comp.slice();
    submitGuess(off, guess)
      .then((res) => {
        setBoard(res.board.map((g) => entryFrom(g, pz.weights)));
        setStatus(res.status);
        setRecipe(res.recipe);
        setComposition([]);
        const finished = res.status !== "composing";
        setOverlayOpen(finished);
        if (finished) {
          if (signedIn) {
            getMyStats().then(setMyStats);
          } else if (today) {
            // Anonymous: keep a local stats aggregate as a display nicety.
            updateAnonStats(res.status === "won", res.board.length, Number(pz.num), setAnonStats);
          }
        }
      })
      .finally(() => setPending(false));
  }, [pending, signedIn]);

  const goToDay = useCallback((delta: number) => {
    const newOffset = latest.current.dayOffset + delta;
    if (newOffset < 0) return;
    setDayOffset(newOffset);
  }, []);

  const startPlay = useCallback(() => setScreen("play"), []);
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
    ready,
    screen,
    puzzle,
    composition,
    board,
    status,
    finished: status !== "composing",
    pending,
    isToday,
    recipe,
    overlayOpen,
    signedIn,
    myStats,
    anonStats,
    copied,
    dayOffset,
    canGoBack,
    dateLabel,
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

function updateAnonStats(
  won: boolean,
  guesses: number,
  dayNum: number,
  set: (s: Stats) => void,
) {
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
  set(s);
}
