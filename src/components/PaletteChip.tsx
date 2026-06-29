import type { Clue } from "@/lib/engine";
import { ClueIcon } from "./ui/ClueIcon";

interface PaletteChipProps {
  name: string;
  code: string;
  css: string;
  keyLabel: string;
  clue: Clue;
  iconColor: string;
  excluded: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function PaletteChip({ name, code, css, keyLabel, clue, iconColor, excluded, disabled, onClick }: PaletteChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : excluded ? 0.45 : 1 }}
      className="w-[58px] md:w-[78px] flex-none text-left border border-line rounded-card overflow-hidden bg-surface p-0 cursor-pointer disabled:cursor-not-allowed"
    >
      <div className="h-7 md:h-[30px] relative" style={{ background: css, filter: excluded ? "grayscale(1)" : "none" }}>
        <span className="absolute top-[3px] left-[3px] min-w-[15px] h-[15px] px-[3px] rounded-[3px] bg-black/55 text-white hidden md:flex items-center justify-center font-mono text-2xs font-bold uppercase">
          {keyLabel}
        </span>
        <span className="absolute top-0.5 right-1 leading-none">
          <ClueIcon clue={clue} color={iconColor} size={18} />
        </span>
        {excluded && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(0,0,0,0.55)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(0,0,0,0.55)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
        )}
      </div>
      <div className="px-1 pt-0.5 pb-0.5 md:px-1.5 md:pt-[3px] md:pb-1">
        <div className="font-medium text-2xs md:text-xs text-ink leading-[1.15] whitespace-nowrap overflow-hidden text-ellipsis">
          {name}
        </div>
        <div className="font-mono text-2xs text-sub mt-px hidden md:block">{code}</div>
      </div>
    </button>
  );
}
