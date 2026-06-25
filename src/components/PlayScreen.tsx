import { Delete, CornerDownLeft } from "lucide-react";
import {
  fgFor,
  getPigment,
  pureMix,
  rgbToCss,
  CELLS,
  GUESSES,
  type BoardEntry,
  type Clue,
  type Puzzle,
} from "@/lib/engine";
import { useKeyLabels } from "@/lib/keyboard";
import { ClueLegend } from "./ClueLegend";
import { SectionLabel } from "./ui/SectionLabel";
import { hasClueIcon } from "./ui/ClueIcon";
import { PrimaryButton } from "./ui/buttons";
import { PaletteChip } from "./PaletteChip";
import { GuessRow, type RowCell } from "./GuessRow";

interface PlayScreenProps {
  puzzle: Puzzle;
  composition: string[];
  board: BoardEntry[];
  finished: boolean;
  addDose: (id: string) => void;
  removeDose: (i: number) => void;
  submit: () => void;
}

export function PlayScreen({ puzzle, composition, board, finished, addDose, removeDose, submit }: PlayScreenProps) {
  const keyLabels = useKeyLabels();
  const best = board.length ? Math.max(...board.map((b) => b.fb.matchPercent)) : 0;
  const gaugeFill = `hsl(${Math.round(best * 1.2)},62%,46%)`;
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

  const rows = Array.from({ length: GUESSES }, (_, i): { filled: boolean; swatchCss: string; cells: RowCell[]; pctText: string } => {
    const b = board[i];
    if (!b) {
      return {
        filled: false,
        swatchCss: "transparent",
        cells: weights.map((w) => ({ css: "transparent", clue: "none" as Clue, iconColor: "transparent", weight: w })),
        pctText: "",
      };
    }
    const cells = b.recipe.map((id, idx) => {
      const rgb = pureMix(id);
      const clue = b.fb.clues[idx];
      return { css: rgbToCss(rgb), clue, iconColor: hasClueIcon(clue) ? fgFor(rgb) : "transparent", weight: weights[idx] };
    });
    return { filled: true, swatchCss: rgbToCss(b.fb.rgb), cells, pctText: b.fb.matchPercent + "%" };
  });

  const targetBand = (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel className="mb-2">TARGET</SectionLabel>
        <div
          className="border border-line rounded-card shadow-overlay h-[104px]"
          style={{ background: rgbToCss(puzzle.target) }}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <SectionLabel>BEST MATCH</SectionLabel>
          <div className="font-display font-bold text-[34px] leading-[0.9]">
            {board.length ? best + "%" : "—"}
          </div>
        </div>
        <div className="h-3 border border-line rounded-card mt-2 bg-surface overflow-hidden">
          <div
            className="h-full transition-[width] duration-[550ms] ease-[cubic-bezier(.2,.7,.2,1)]"
            style={{ width: (board.length ? best : 0) + "%", background: gaugeFill }}
          />
        </div>
      </div>
      <ClueLegend />
    </div>
  );

  return (
    <div>
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_300px] mb-12">
        <div>
          {rows.map((row, i) => (
            <GuessRow key={i} {...row} />
          ))}
        </div>
        {targetBand}
      </div>

      <div>
        <div className="flex justify-end mb-3">
          <span className="font-mono text-[10px] text-sub inline-flex items-center gap-1.5">
            press a key
            <span className="inline-flex items-center gap-1">· <Delete size={12} strokeWidth={2} /> delete</span>
            <span className="inline-flex items-center gap-1">· <CornerDownLeft size={12} strokeWidth={2} /> guess</span>
          </span>
        </div>
        <div className="flex gap-[9px] flex-wrap justify-center mb-9">
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
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-[7px] flex-1 max-w-[360px]">
            {weights.map((w, i) => {
              const id = composition[i];
              return (
                <div key={i} className="flex flex-col" style={{ flexGrow: w, flexBasis: 0 }}>
                  {id ? (
                    <button
                      onClick={() => removeDose(i)}
                      disabled={finished}
                      className="h-10 w-full border border-line rounded-card p-0 font-mono text-[9px] font-bold cursor-pointer disabled:cursor-default overflow-hidden"
                      style={{ background: rgbToCss(pureMix(id)), color: fgFor(pureMix(id)) }}
                    >
                      {getPigment(id).code.split("-")[0]}
                    </button>
                  ) : (
                    <div className="h-10 w-full border border-dashed border-sub rounded-card" />
                  )}
                  <span className="font-mono text-[9px] text-sub text-center mt-1">×{w}</span>
                </div>
              );
            })}
          </div>
          <PrimaryButton
            onClick={submit}
            disabled={!canGuess}
            style={{ opacity: canGuess ? 1 : 0.4 }}
            className="ml-auto text-[12px] tracking-[0.08em] px-5 py-2.5"
          >
            Guess · {composition.length}/{CELLS}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
