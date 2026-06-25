import {
  clueIcon,
  fgFor,
  getPigment,
  pureMix,
  rgbToCss,
  DOSES,
  GUESSES,
  type BoardEntry,
  type Clue,
  type Puzzle,
} from "@/lib/engine";
import { useKeyLabels } from "@/lib/keyboard";
import { ClueLegend } from "./ClueLegend";
import { SectionLabel } from "./ui/SectionLabel";
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
  const compFull = composition.length >= DOSES;
  const canGuess = composition.length === DOSES && !finished;

  const pigHint: Record<string, Clue> = {};
  puzzle.palette.forEach((id) => {
    pigHint[id] = "none";
  });
  board.forEach((b) => {
    puzzle.palette.forEach((id) => {
      const c = b.fb.clues[id];
      if (c === "grey") pigHint[id] = "grey";
      else if (c === "green" && pigHint[id] !== "grey") pigHint[id] = "green";
      else if (c === "yellow" && pigHint[id] === "none") pigHint[id] = "yellow";
    });
  });

  const rows = Array.from({ length: GUESSES }, (_, i): { filled: boolean; swatchCss: string; cells: RowCell[]; pctText: string } => {
    const b = board[i];
    if (!b) {
      return {
        filled: false,
        swatchCss: "transparent",
        cells: Array.from({ length: DOSES }, () => ({ css: "transparent", icon: "", iconColor: "transparent" })),
        pctText: "",
      };
    }
    const sorted = b.recipe.slice().sort((x, y) => puzzle.palette.indexOf(x) - puzzle.palette.indexOf(y));
    const cells = sorted.map((id) => {
      const rgb = pureMix(id);
      const icon = clueIcon(b.fb.clues[id]);
      return { css: rgbToCss(rgb), icon, iconColor: icon ? fgFor(rgb) : "transparent" };
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
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px] mb-12">
        <div>
          {rows.map((row, i) => (
            <GuessRow key={i} {...row} />
          ))}
        </div>
        {targetBand}
      </div>

      <div>
        <div className="flex justify-end mb-3">
          <span className="font-mono text-[10px] text-sub">press a key · ⌫ delete · ⏎ guess</span>
        </div>
        <div className="flex gap-[9px] flex-wrap justify-center mb-9">
          {puzzle.palette.map((id, i) => {
            const p = getPigment(id);
            const rgb = pureMix(id);
            const hint = pigHint[id];
            const icon = clueIcon(hint);
            const excluded = hint === "grey";
            const disabled = compFull || finished;
            return (
              <PaletteChip
                key={id}
                name={p.name}
                code={p.code}
                css={rgbToCss(rgb)}
                keyLabel={keyLabels[i] || ""}
                icon={icon}
                iconColor={icon ? fgFor(rgb) : "transparent"}
                excluded={excluded}
                disabled={disabled}
                onClick={() => addDose(id)}
              />
            );
          })}
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-[7px]">
            {Array.from({ length: DOSES }, (_, i) => {
              const id = composition[i];
              if (!id) {
                return <div key={i} className="w-10 h-10 border border-dashed border-sub rounded-card" />;
              }
              const rgb = pureMix(id);
              return (
                <button
                  key={i}
                  onClick={() => removeDose(i)}
                  disabled={finished}
                  className="w-10 h-10 border border-line rounded-card p-0 font-mono text-[9px] font-bold cursor-pointer disabled:cursor-default"
                  style={{ background: rgbToCss(rgb), color: fgFor(rgb) }}
                >
                  {getPigment(id).code.split("-")[0]}
                </button>
              );
            })}
          </div>
          <PrimaryButton
            onClick={submit}
            disabled={!canGuess}
            style={{ opacity: canGuess ? 1 : 0.4 }}
            className="ml-auto text-[12px] tracking-[0.08em] px-5 py-2.5"
          >
            Guess · {composition.length}/{DOSES}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
