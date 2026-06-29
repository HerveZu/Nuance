import { Delete, CornerDownLeft } from "lucide-react";
import {
  getPigment,
  pureMix,
  CELLS,
  GUESSES,
  type BoardEntry,
  type Clue,
  type PublicPuzzle,
} from "@/lib/engine";
import { fgFor, rgbToCss } from "@/lib/color";
import { useKeyLabels } from "@/lib/keyboard";
import { ClueLegend } from "./ClueLegend";
import { SectionLabel } from "./ui/SectionLabel";
import { hasClueIcon } from "./ui/ClueIcon";
import { PrimaryButton } from "./ui/buttons";
import { PaletteChip } from "./PaletteChip";
import { GuessRow, type RowCell } from "./GuessRow";

interface PlayScreenProps {
  puzzle: PublicPuzzle;
  composition: string[];
  board: BoardEntry[];
  finished: boolean;
  addDose: (id: string) => void;
  removeDose: (i: number) => void;
  submit: () => void;
}

export function PlayScreen({ puzzle, composition, board, finished, addDose, removeDose, submit }: PlayScreenProps) {
  const keyLabels = useKeyLabels();
  const compFull = composition.length >= CELLS;
  const canGuess = composition.length === CELLS && !finished;
  const weights = puzzle.weights;

  // Per-pigment guidance. A pigment that ever earned a green or yellow clue is
  // confirmed to be in the recipe. A pigment that earned a grey clue but never
  // a green/yellow is definitely absent — placing a pigment that's in the mix
  // always returns green or yellow, so a lone grey means "not in the recipe".
  const pigHint: Record<string, Clue> = {};
  const triedGrey: Record<string, boolean> = {};
  puzzle.palette.forEach((id) => {
    pigHint[id] = "none";
  });
  board.forEach((b) => {
    b.recipe.forEach((id, i) => {
      const c = b.fb.clues[i];
      if (c === "green") pigHint[id] = "green";
      else if (c === "yellow" && pigHint[id] !== "green") pigHint[id] = "yellow";
      else if (c === "grey") triedGrey[id] = true;
    });
  });

  const activeIndex = finished ? -1 : board.length;

  const rowEls = Array.from({ length: GUESSES }, (_, i) => {
    const b = board[i];
    if (b) {
      const cells: RowCell[] = b.recipe.map((id, idx) => {
        const rgb = pureMix(id);
        const clue = b.fb.clues[idx];
        return { css: rgbToCss(rgb), clue, iconColor: hasClueIcon(clue) ? fgFor(rgb) : "transparent", weight: weights[idx] };
      });
      const trailing = (
        <>
          <span className="font-display font-bold text-md md:text-lg tabular-nums whitespace-nowrap">{b.fb.matchPercent}%</span>
          <div className="w-8 md:w-10 self-stretch md:h-[42px] border border-line rounded-card shrink-0" style={{ background: rgbToCss(b.fb.rgb) }} />
        </>
      );
      return <GuessRow key={i} cells={cells} trailing={trailing} />;
    }

    if (i === activeIndex) {
      const cells: RowCell[] = weights.map((w, idx) => {
        const id = composition[idx];
        if (!id) return { css: "transparent", clue: "none" as Clue, iconColor: "transparent", weight: w, placeholder: true, label: "×" + w, textColor: "var(--color-sub)" };
        const rgb = pureMix(id);
        return {
          css: rgbToCss(rgb),
          clue: "none" as Clue,
          iconColor: "transparent",
          weight: w,
          label: getPigment(id).code.split("-")[0],
          textColor: fgFor(rgb),
        };
      });
      const trailing = (
        <PrimaryButton
          onClick={submit}
          disabled={!canGuess}
          style={{ opacity: canGuess ? 1 : 0.4 }}
          className="w-full h-full md:h-[42px] inline-flex items-center justify-center text-2xs md:text-sm tracking-[0.06em] px-1"
        >
          Guess
        </PrimaryButton>
      );
      return <GuessRow key={i} cells={cells} trailing={trailing} active onCellClick={removeDose} />;
    }

    const cells: RowCell[] = weights.map((w) => ({ css: "transparent", clue: "none" as Clue, iconColor: "transparent", weight: w, placeholder: true }));
    return <GuessRow key={i} cells={cells} dimmed />;
  });

  const desktopTargetSection = (
    <div className="flex items-end justify-between gap-8">
      <ClueLegend className="flex flex-row items-center gap-x-6 gap-y-2 flex-wrap" />
      <div className="flex items-center gap-3 shrink-0">
        <SectionLabel>TARGET</SectionLabel>
        <div
          className="w-[170px] h-[52px] border border-line rounded-card shadow-overlay"
          style={{ background: rgbToCss(puzzle.target) }}
        />
      </div>
    </div>
  );

  const mobileTargetBand = (
    <div className="flex items-center gap-3 md:hidden">
      <SectionLabel className="shrink-0">TARGET</SectionLabel>
      <div className="h-9 flex-1 border border-line rounded-card" style={{ background: rgbToCss(puzzle.target) }} />
    </div>
  );

  const paletteBlock = (
    <div>
      <div className="flex gap-2 md:gap-[9px] flex-wrap justify-center">
        {puzzle.palette.map((id, i) => {
          const p = getPigment(id);
          const rgb = pureMix(id);
          const hint = pigHint[id];
          const excluded = !hasClueIcon(hint) && !!triedGrey[id];
          const disabled = compFull || finished;
          return (
            <PaletteChip
              key={id}
              name={p.name}
              code={p.code}
              css={rgbToCss(rgb)}
              keyLabel={keyLabels[i] || ""}
              clue={hint}
              iconColor={hasClueIcon(hint) ? fgFor(rgb) : "transparent"}
              excluded={excluded}
              disabled={disabled}
              onClick={() => addDose(id)}
            />
          );
        })}
      </div>
      <div className="hidden md:flex justify-center mt-4">
        <span className="font-mono text-xs text-sub inline-flex items-center gap-1.5">
          press a key
          <span className="inline-flex items-center gap-1">· <Delete size={12} strokeWidth={2} /> delete</span>
          <span className="inline-flex items-center gap-1">· <CornerDownLeft size={12} strokeWidth={2} /> guess</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 justify-center md:block">
      <div className="min-w-0 flex flex-col gap-2 md:block md:mb-8">
        {rowEls}
      </div>

      <div className="hidden md:block md:mb-8">{desktopTargetSection}</div>

      <div className="flex flex-col gap-5 shrink-0 mt-12 md:mt-0 md:gap-0">
        <div className="md:hidden">
          <ClueLegend />
        </div>
        {mobileTargetBand}
        {paletteBlock}
      </div>
    </div>
  );
}
