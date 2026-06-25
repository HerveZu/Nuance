import {
  buildShareText,
  getPigment,
  pureMix,
  recipeText,
  rgbToCss,
  GUESSES,
  type BoardEntry,
  type Puzzle,
  type Stats,
} from "@/lib/engine";
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
      <div className="font-bold text-2xl">{value}</div>
      <div className="font-mono text-[9px] text-sub tracking-[0.06em] mt-[3px]">{label}</div>
    </div>
  );
}

export function ResultsOverlay({ puzzle, board, won, free, stats, copied, onClose, onShare }: ResultsOverlayProps) {
  const best = board.length ? Math.max(...board.map((b) => b.fb.matchPercent)) : 0;
  const gaugeFill = `hsl(${Math.round(best * 1.2)},62%,46%)`;
  const distribution = stats.distribution || [0, 0, 0, 0, 0, 0];
  const distMax = Math.max(1, ...distribution);
  const thisAttempt = won ? board.length : -1;
  const winPct = stats.played ? Math.round(((stats.wins || 0) / stats.played) * 100) : 0;
  const shareText = buildShareText(board, puzzle, won);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 z-50" style={{ background: "rgba(22,19,15,0.55)" }}>
      <div className="bg-surface border border-line rounded-card shadow-overlay max-w-[440px] w-full px-7 pt-[26px] pb-7 max-h-[92vh] overflow-auto">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-display font-bold text-[28px] leading-[1.05] tracking-[-0.01em]">
              {won ? "SOLVED" : "OUT OF GUESSES"}
            </div>
            <div className="font-mono text-xs text-sub mt-1.5">
              {won
                ? `Matched in ${board.length}/${GUESSES}${free ? " · free play" : ""}`
                : "The target recipe is revealed below."}
            </div>
          </div>
          <button onClick={onClose} className="border-none bg-transparent text-[22px] leading-none text-sub cursor-pointer px-1 py-0.5">
            ✕
          </button>
        </div>

        <SectionLabel className="mt-[22px] mb-2.5">THE RECIPE</SectionLabel>
        <div className="flex gap-1.5">
          {puzzle.canonical.map((id, i) => (
            <div key={i} className="flex-1">
              <div className="h-12 border border-line rounded-card" style={{ background: rgbToCss(pureMix(id)) }} />
              <div className="font-mono text-[9px] text-sub text-center mt-1">{getPigment(id).code.split("-")[0]}</div>
            </div>
          ))}
        </div>
        <div className="text-[13px] text-sub mt-3">{recipeText(puzzle.canonical)}</div>

        <div className="flex gap-2 mt-6 mb-1.5">
          <Stat value={stats.played || 0} label="PLAYED" />
          <Stat value={winPct} label="WIN %" />
          <Stat value={stats.currentStreak || 0} label="STREAK" />
          <Stat value={stats.maxStreak || 0} label="MAX" />
        </div>

        <SectionLabel className="mt-[22px] mb-2.5">GUESS DISTRIBUTION</SectionLabel>
        <div className="flex items-end gap-1.5 h-20">
          {distribution.slice(0, GUESSES).map((count, i) => {
            const highlight = i + 1 === thisAttempt;
            const color = highlight ? gaugeFill : "var(--color-ink)";
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="font-mono text-[10px] mb-[3px]" style={{ color }}>
                  {count}
                </div>
                <div
                  className="w-full min-h-[3px] rounded-card"
                  style={{ height: Math.round((count / distMax) * 60) + "px", background: color }}
                />
                <div className="font-mono text-[10px] text-sub mt-[5px]">{i + 1}</div>
              </div>
            );
          })}
        </div>

        <div className="font-mono text-[13px] whitespace-pre leading-[1.5] bg-ground border border-line rounded-card py-3.5 px-4 mt-6 mb-3.5 overflow-x-auto">
          {shareText}
        </div>
        <PrimaryButton onClick={() => onShare(shareText)} className="w-full text-[13px] tracking-[0.1em] py-[15px]">
          {copied ? "COPIED ✓" : "SHARE RESULT"}
        </PrimaryButton>
      </div>
    </div>
  );
}
