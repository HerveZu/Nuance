"use client";

import { useState } from "react";
import Link from "next/link";
import {
  buildShareText,
  getPigment,
  pureMix,
  recipeText,
  GUESSES,
  type BoardEntry,
  type PublicPuzzle,
  type Stats,
} from "@/lib/engine";
import type { MyStats } from "@/app/actions";
import { rgbToCss } from "@/lib/color";
import { X, Check, Trophy } from "lucide-react";
import { SectionLabel } from "./ui/SectionLabel";
import { Surface } from "./ui/Surface";
import { Swatch } from "./ui/Swatch";
import { CLUE_META } from "./ui/clue";
import { PrimaryButton, GhostButton } from "./ui/buttons";
import { AuthDialog } from "./AuthDialog";

interface ResultsOverlayProps {
  puzzle: PublicPuzzle;
  board: BoardEntry[];
  recipe: string[];
  won: boolean;
  isToday: boolean;
  signedIn: boolean;
  myStats: MyStats | null;
  anonStats: Stats;
  copied: boolean;
  onClose: () => void;
  onShare: (text: string) => void;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex-1 text-center border border-line rounded-card py-3 px-1.5">
      <div className="font-bold text-xl">{value}</div>
      <div className="text-meta tracking-caption mt-[3px]">{label}</div>
    </div>
  );
}

export function ResultsOverlay({
  puzzle,
  board,
  recipe,
  won,
  isToday,
  signedIn,
  myStats,
  anonStats,
  copied,
  onClose,
  onShare,
}: ResultsOverlayProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const shareText = buildShareText(board, puzzle, won);
  const CELL_UNIT = 13; // px of bar height per matched cell

  const stats = (() => {
    if (signedIn && myStats) {
      const winPct = myStats.gamesPlayed ? Math.round((myStats.gamesWon / myStats.gamesPlayed) * 100) : 0;
      return [
        { value: myStats.gamesPlayed, label: "PLAYED" },
        { value: winPct, label: "WIN %" },
        { value: myStats.avgScore != null ? myStats.avgScore.toFixed(1) : "–", label: "AVG" },
        { value: myStats.currentStreak, label: "STREAK" },
      ];
    }
    const winPct = anonStats.played ? Math.round(((anonStats.wins || 0) / anonStats.played) * 100) : 0;
    return [
      { value: anonStats.played || 0, label: "PLAYED" },
      { value: winPct, label: "WIN %" },
      { value: anonStats.currentStreak || 0, label: "STREAK" },
      { value: anonStats.maxStreak || 0, label: "MAX" },
    ];
  })();

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 z-50 bg-scrim">
      <Surface className="shadow-overlay max-w-[440px] w-full px-7 pt-[26px] pb-7 max-h-[92vh] overflow-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-display font-bold text-2xl leading-[1.05] tracking-[-0.01em]">
              {won ? "SOLVED" : "OUT OF GUESSES"}
            </div>
            <div className="font-mono text-base text-sub mt-1.5">
              {won
                ? `Matched in ${board.length}/${GUESSES}${!isToday ? " · free play" : ""}`
                : "The target recipe is revealed below."}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="border-none bg-transparent leading-none text-sub cursor-pointer px-1 py-0.5">
            <X size={22} />
          </button>
        </div>

        <SectionLabel className="mt-[22px] mb-2.5">THE RECIPE</SectionLabel>
        <div className="flex gap-1.5">
          {recipe.map((id, i) => (
            <div key={i} style={{ flexGrow: puzzle.weights[i], flexBasis: 0 }}>
              <Swatch css={rgbToCss(pureMix(id))} className="h-12" />
              <div className="text-meta text-center mt-1">{getPigment(id).code.split("-")[0]}</div>
            </div>
          ))}
        </div>
        <div className="text-md text-sub mt-3">{recipeText(recipe, puzzle.weights)}</div>

        <div className="flex gap-2 mt-6 mb-1.5">
          {stats.map((s) => (
            <Stat key={s.label} value={s.value} label={s.label} />
          ))}
        </div>

        <SectionLabel className="mt-[22px] mb-2.5">GUESS DISTRIBUTION</SectionLabel>
        <div className="flex items-end gap-1.5">
          {board.map((b, i) => {
            const greens = b.fb.clues.filter((c) => c === "green").length;
            const yellows = b.fb.clues.filter((c) => c === "yellow").length;
            const matched = greens + yellows;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="font-mono text-xs mb-[3px]">{matched}</div>
                <div className="w-full flex flex-col rounded-card overflow-hidden">
                  {yellows > 0 && (
                    <div style={{ height: yellows * CELL_UNIT, background: CLUE_META.yellow.colorVar }} />
                  )}
                  {greens > 0 && (
                    <div style={{ height: greens * CELL_UNIT, background: CLUE_META.green.colorVar }} />
                  )}
                  {matched === 0 && <div className="h-[3px] bg-line" />}
                </div>
                <div className="font-mono text-xs text-sub mt-[5px]">{i + 1}</div>
              </div>
            );
          })}
        </div>

        {!signedIn && (
          <div className="bg-ground border border-line rounded-card py-3.5 px-4 mt-6">
            <p className="font-mono text-md text-sub mb-2.5">Sign in to compete on the global leaderboard and keep your streak.</p>
            <PrimaryButton onClick={() => setAuthOpen(true)} className="w-full inline-flex items-center justify-center text-md tracking-label py-2.5">
              Sign in
            </PrimaryButton>
          </div>
        )}

        <div className="font-mono text-md whitespace-pre leading-[1.5] bg-ground border border-line rounded-card py-3.5 px-4 mt-6 mb-3.5 overflow-x-auto">
          {shareText}
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={() => onShare(shareText)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-md tracking-label py-[15px]">
            {copied ? (<><Check size={15} /> COPIED</>) : "SHARE RESULT"}
          </PrimaryButton>
          <Link href="/leaderboard" className="shrink-0">
            <GhostButton className="h-full inline-flex items-center justify-center gap-1.5 text-md tracking-wide uppercase px-4">
              <Trophy size={15} /> Board
            </GhostButton>
          </Link>
        </div>
      </Surface>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
