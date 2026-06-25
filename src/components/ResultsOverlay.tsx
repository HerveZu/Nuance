import {
  buildShareText,
  getPigment,
  pureMix,
  recipeText,
  GUESSES,
  type BoardEntry,
  type Puzzle,
  type Stats,
} from "@/lib/engine";
import { rgbToCss } from "@/lib/color";
import { X, Check } from "lucide-react";
import { SectionLabel } from "./ui/SectionLabel";
import { PrimaryButton } from "./ui/buttons";

interface ResultsOverlayProps {
  puzzle: Puzzle;
  board: BoardEntry[];
  won: boolean;
  free: boolean;
  stats: Stats;
  copied: boolean;
  onClose: () => void;
  onShare: (text: string) => void;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex-1 text-center border border-line rounded-card py-3 px-1.5">
      <div className="font-bold text-xl">{value}</div>
      <div className="font-mono text-2xs text-sub tracking-[0.06em] mt-[3px]">{label}</div>
    </div>
  );
}

export function ResultsOverlay({ puzzle, board, won, free, stats, copied, onClose, onShare }: ResultsOverlayProps) {
  const winPct = stats.played ? Math.round(((stats.wins || 0) / stats.played) * 100) : 0;
  const shareText = buildShareText(board, puzzle, won);
  const CELL_UNIT = 13; // px of bar height per matched cell

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 z-50" style={{ background: "rgba(22,19,15,0.55)" }}>
      <div className="bg-surface border border-line rounded-card shadow-overlay max-w-[440px] w-full px-7 pt-[26px] pb-7 max-h-[92vh] overflow-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-display font-bold text-2xl leading-[1.05] tracking-[-0.01em]">
              {won ? "SOLVED" : "OUT OF GUESSES"}
            </div>
            <div className="font-mono text-base text-sub mt-1.5">
              {won
                ? `Matched in ${board.length}/${GUESSES}${free ? " · free play" : ""}`
                : "The target recipe is revealed below."}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="border-none bg-transparent leading-none text-sub cursor-pointer px-1 py-0.5">
            <X size={22} />
          </button>
        </div>

        <SectionLabel className="mt-[22px] mb-2.5">THE RECIPE</SectionLabel>
        <div className="flex gap-1.5">
          {puzzle.canonical.map((id, i) => (
            <div key={i} style={{ flexGrow: puzzle.weights[i], flexBasis: 0 }}>
              <div className="h-12 border border-line rounded-card" style={{ background: rgbToCss(pureMix(id)) }} />
              <div className="font-mono text-2xs text-sub text-center mt-1">{getPigment(id).code.split("-")[0]}</div>
            </div>
          ))}
        </div>
        <div className="text-md text-sub mt-3">{recipeText(puzzle.canonical, puzzle.weights)}</div>

        <div className="flex gap-2 mt-6 mb-1.5">
          <Stat value={stats.played || 0} label="PLAYED" />
          <Stat value={winPct} label="WIN %" />
          <Stat value={stats.currentStreak || 0} label="STREAK" />
          <Stat value={stats.maxStreak || 0} label="MAX" />
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
                    <div style={{ height: yellows * CELL_UNIT, background: "var(--color-clue-yellow)" }} />
                  )}
                  {greens > 0 && (
                    <div style={{ height: greens * CELL_UNIT, background: "var(--color-clue-green)" }} />
                  )}
                  {matched === 0 && <div className="h-[3px] bg-line" />}
                </div>
                <div className="font-mono text-xs text-sub mt-[5px]">{i + 1}</div>
              </div>
            );
          })}
        </div>

        <div className="font-mono text-md whitespace-pre leading-[1.5] bg-ground border border-line rounded-card py-3.5 px-4 mt-6 mb-3.5 overflow-x-auto">
          {shareText}
        </div>
        <PrimaryButton onClick={() => onShare(shareText)} className="w-full inline-flex items-center justify-center gap-1.5 text-md tracking-[0.1em] py-[15px]">
          {copied ? (<><Check size={15} /> COPIED</>) : "SHARE RESULT"}
        </PrimaryButton>
      </div>
    </div>
  );
}
