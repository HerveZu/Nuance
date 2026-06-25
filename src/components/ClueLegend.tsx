import { Check, ChevronsUpDown } from "lucide-react";

function LegendItem({ color, icon, children }: { color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-[18px] h-[18px] rounded-full text-white flex items-center justify-center"
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
      <LegendItem color="var(--color-clue-green)" icon={<Check size={11} strokeWidth={3} />}>
        Right pigment &amp; cell
      </LegendItem>
      <LegendItem color="var(--color-clue-yellow)" icon={<ChevronsUpDown size={11} strokeWidth={3} />}>
        Right pigment, wrong cell
      </LegendItem>
    </div>
  );
}
