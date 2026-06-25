export interface RowCell {
  css: string;
  icon: string;
  iconColor: string;
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
      <div className="w-10 h-[42px] border border-line rounded-card shrink-0" style={{ background: swatchCss }} />
      <div className="w-[42px] text-left font-display font-bold text-[15px] tabular-nums shrink-0">{pctText}</div>
      {cells.map((cell, i) => (
        <div
          key={i}
          className={`flex-1 h-[42px] rounded-card overflow-hidden flex items-center justify-center ${cellBorder}`}
          style={{ background: cell.css }}
        >
          <span className="font-ui text-[26px] font-extrabold leading-none" style={{ color: cell.iconColor }}>
            {cell.icon}
          </span>
        </div>
      ))}
    </div>
  );
}
