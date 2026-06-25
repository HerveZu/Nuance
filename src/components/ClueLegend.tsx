function LegendItem({ color, icon, children }: { color: string; icon: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-[18px] h-[18px] rounded-full text-white flex items-center justify-center font-ui text-[11px] font-bold"
        style={{ background: color }}
      >
        {icon}
      </span>
      {children}
    </span>
  );
}

export function ClueLegend({ className = "flex flex-col gap-2.5" }: { className?: string }) {
  return (
    <div className={`font-mono text-[10.5px] text-ink ${className}`}>
      <LegendItem color="var(--color-clue-green)" icon="✓">
        Right pigment &amp; dose
      </LegendItem>
      <LegendItem color="var(--color-clue-yellow)" icon="↕">
        Right pigment, wrong amount
      </LegendItem>
    </div>
  );
}
