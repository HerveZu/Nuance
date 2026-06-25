import type { Clue } from "@/lib/engine";
import { ClueIcon } from "./ui/ClueIcon";

export interface RowCell {
  css: string;
  clue: Clue;
  iconColor: string;
  weight: number;
}

interface GuessRowProps {
  filled: boolean;
  swatchCss: string;
  cells: RowCell[];
  pctText: string;
}

export function GuessRow({ filled, swatchCss, cells, pctText }: GuessRowProps) {
  const cellBorder = filled ? "border border-line" : "border border-dashed border-sub";
  return (
    <div className="flex gap-1.5 items-center mb-[7px]" style={{ opacity: filled ? 1 : 0.45 }}>
      {cells.map((cell, i) => (
        <div
          key={i}
          className={`h-[42px] rounded-card overflow-hidden flex items-center justify-center ${cellBorder}`}
          style={{ background: cell.css, flexGrow: cell.weight, flexBasis: 0 }}
        >
          <ClueIcon clue={cell.clue} color={cell.iconColor} size={26} />
        </div>
      ))}
      <div className="w-[42px] ml-3 text-right font-display font-bold text-[15px] tabular-nums shrink-0">{pctText}</div>
      <div className="w-10 h-[42px] border border-line rounded-card shrink-0" style={{ background: swatchCss }} />
    </div>
  );
}
