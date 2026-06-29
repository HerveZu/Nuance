import type { Clue } from "@/lib/engine";
import { ClueIcon } from "./ui/ClueIcon";

export interface RowCell {
  css: string;
  clue: Clue;
  iconColor: string;
  weight: number;
  placeholder?: boolean;
  label?: string;
  textColor?: string;
}

interface GuessRowProps {
  cells: RowCell[];
  trailing?: React.ReactNode;
  active?: boolean;
  dimmed?: boolean;
  onCellClick?: (i: number) => void;
}

export function GuessRow({ cells, trailing, active, dimmed, onCellClick }: GuessRowProps) {
  return (
    <div
      className="flex gap-1.5 items-stretch md:items-center h-9 md:h-[42px] shrink-0 md:mb-[7px]"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      {cells.map((cell, i) => {
        const border = cell.placeholder
          ? active
            ? "border border-dashed border-ink/50"
            : "border border-dashed border-sub"
          : "border border-line";
        const clickable = active && !cell.placeholder && !!onCellClick;
        const common = `h-full md:h-[42px] min-h-0 rounded-card overflow-hidden flex items-center justify-center ${border}`;
        const style = { background: cell.css, flexGrow: cell.weight, flexBasis: 0 } as React.CSSProperties;
        const content = cell.label ? (
          <span className="font-mono text-2xs font-bold" style={{ color: cell.textColor }}>
            {cell.label}
          </span>
        ) : (
          <ClueIcon clue={cell.clue} color={cell.iconColor} size={26} />
        );
        return clickable ? (
          <button key={i} onClick={() => onCellClick!(i)} className={`${common} p-0 cursor-pointer`} style={style}>
            {content}
          </button>
        ) : (
          <div key={i} className={common} style={style}>
            {content}
          </div>
        );
      })}
      <div className="w-[74px] md:w-[92px] ml-2 md:ml-3 shrink-0 flex items-center justify-end gap-1.5">
        {trailing}
      </div>
    </div>
  );
}
