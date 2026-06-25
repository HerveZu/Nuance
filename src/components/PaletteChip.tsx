interface PaletteChipProps {
  name: string;
  code: string;
  css: string;
  keyLabel: string;
  icon: string;
  iconColor: string;
  excluded: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function PaletteChip({ name, code, css, keyLabel, icon, iconColor, excluded, disabled, onClick }: PaletteChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : excluded ? 0.45 : 1 }}
      className="w-[78px] flex-none text-left border border-line rounded-card overflow-hidden bg-surface p-0 cursor-pointer disabled:cursor-not-allowed"
    >
      <div className="h-[30px] relative" style={{ background: css, filter: excluded ? "grayscale(1)" : "none" }}>
        <span className="absolute top-[3px] left-[3px] min-w-[15px] h-[15px] px-[3px] rounded-[3px] bg-black/55 text-white flex items-center justify-center font-mono text-[9px] font-bold uppercase">
          {keyLabel}
        </span>
        <span className="absolute top-0.5 right-1 font-ui text-[18px] font-extrabold leading-none" style={{ color: iconColor }}>
          {icon}
        </span>
      </div>
      <div className="px-1.5 pt-[3px] pb-1">
        <div className="font-medium text-[10px] text-ink leading-[1.15] whitespace-nowrap overflow-hidden text-ellipsis">
          {name}
        </div>
        <div className="font-mono text-[8.5px] text-sub mt-px">{code}</div>
      </div>
    </button>
  );
}
