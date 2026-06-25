"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  dailyPuzzle,
  dateForOffset,
  dateKey,
  dayNumber,
  evaluate,
  DOSES,
  GUESSES,
  type BoardEntry,
  type Puzzle,
  type Stats,
} from "@/lib/engine";
import { loadDaily, loadStats, saveDaily, saveStats, defaultStats } from "@/lib/storage";
import { KEY_CODES } from "@/lib/keyboard";

type Status = "composing" | "won" | "lost";

export interface Nuance {
  ready: boolean;
  screen: "launch" | "play";
  puzzle: Puzzle;
  composition: string[];
  board: BoardEntry[];
  status: Status;
  finished: boolean;
  free: boolean;
  overlayOpen: boolean;
  stats: Stats;
  copied: boolean;
  dayOffset: number;
  isToday: boolean;
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function boardFrom(recipes: string[][], puzzle: Puzzle): BoardEntry[] {
  return recipes.map((r) => ({ recipe: r, fb: evaluate(r, puzzle) }));
}

function loadTodayBoard(puzzle: Puzzle): { board: BoardEntry[]; status: Status } {
  const daily = loadDaily();
  if (daily && daily.date === dateKey(dateForOffset(0)) && daily.size === puzzle.palette.length && Array.isArray(daily.board)) {
    return { board: boardFrom(daily.board, puzzle), status: (daily.status as Status) || "composing" };
  }
  return { board: [], status: "composing" };
}

export function useNuance(): Nuance {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"launch" | "play">("launch");
  const [dayOffset, setDayOffset] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => dailyPuzzle(dateForOffset(0)));
  const [composition, setComposition] = useState<string[]>([]);
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [status, setStatus] = useState<Status>("composing");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [free, setFree] = useState(false);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latest = useRef({ screen, dayOffset, puzzle, composition, board, status, overlayOpen, free, stats });
  useEffect(() => {
    latest.current = { screen, dayOffset, puzzle, composition, board, status, overlayOpen, free, stats };
  });

  useEffect(() => {
    // localStorage is unavailable during SSR, so the saved board/stats are
    // hydrated once after mount — a deliberate sync pass, not a render cascade.
    /* eslint-disable react-hooks/set-state-in-effect */
    const pz = dailyPuzzle(dateForOffset(0));
    const { board: savedBoard, status: savedStatus } = loadTodayBoard(pz);
    setPuzzle(pz);
    setBoard(savedBoard);
    setStatus(savedStatus);
    setScreen(savedBoard.length ? "play" : "launch");
    setStats(loadStats());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const isToday = dayOffset === 0;
  const curDate = dateForOffset(dayOffset);
  const canGoBack = dayNumber(curDate) > 1;
  const dateLabel = isToday ? "TODAY" : MONTHS[curDate.getMonth()] + " " + curDate.getDate();

  const goToDay = useCallback((delta: number) => {
    const newOffset = latest.current.dayOffset + delta;
    if (newOffset < 0) return;
    const d = dateForOffset(newOffset);
    if (dayNumber(d) < 1) return;
    const pz = dailyPuzzle(d);
    const atToday = newOffset === 0;
    const { board: nextBoard, status: nextStatus } = atToday ? loadTodayBoard(pz) : { board: [], status: "composing" as Status };
    setDayOffset(newOffset);
    setPuzzle(pz);
    setComposition([]);
    setBoard(nextBoard);
    setStatus(nextStatus);
    setFree(!atToday);
    setOverlayOpen(false);
    setCopied(false);
    setScreen(nextBoard.length ? "play" : "launch");
  }, []);

  const addDose = useCallback((id: string) => {
    const { status: st, composition: comp } = latest.current;
    if (st !== "composing" || comp.length >= DOSES) return;
    setComposition((c) => [...c, id]);
  }, []);

  const removeDose = useCallback((i: number) => {
    if (latest.current.status !== "composing") return;
    setComposition((c) => c.filter((_, j) => j !== i));
  }, []);

  const submit = useCallback(() => {
    const { status: st, composition: comp, board: bd, puzzle: pz, free: fr, stats: prev } = latest.current;
    if (st !== "composing" || comp.length !== DOSES) return;
    const fb = evaluate(comp, pz);
    const nextBoard = [...bd, { recipe: comp.slice(), fb }];
    let next: Status = "composing";
    if (fb.win) next = "won";
    else if (nextBoard.length >= GUESSES) next = "lost";
    setBoard(nextBoard);
    setComposition([]);
    setStatus(next);
    setOverlayOpen(next !== "composing");
    if (!fr) saveDaily(dateKey(dateForOffset(0)), pz.palette.length, nextBoard.map((b) => b.recipe), next);
    if (next !== "composing" && !fr) {
      const s: Stats = { ...prev, distribution: (prev.distribution || [0, 0, 0, 0, 0, 0]).slice() };
      s.played = (s.played || 0) + 1;
      const dn = dayNumber(dateForOffset(0));
      if (next === "won") {
        s.wins = (s.wins || 0) + 1;
        s.distribution[nextBoard.length - 1] = (s.distribution[nextBoard.length - 1] || 0) + 1;
        s.currentStreak = s.lastWinDay === dn - 1 ? (s.currentStreak || 0) + 1 : 1;
        s.lastWinDay = dn;
      } else {
        s.currentStreak = 0;
      }
      s.maxStreak = Math.max(s.maxStreak || 0, s.currentStreak || 0);
      setStats(s);
      saveStats(s);
    }
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
      if (cur.overlayOpen) return;
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
    free,
    overlayOpen,
    stats,
    copied,
    dayOffset,
    isToday,
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
