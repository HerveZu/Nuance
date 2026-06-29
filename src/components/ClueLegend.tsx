import { Check, ChevronsUpDown } from "lucide-react";

function LegendItem({ color, icon, children }: { color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="w-[18px] h-[18px] rounded-full text-white flex items-center justify-center shrink-0"
        style={{ background: color }}
      >
        {icon}
      </span>
      {children}
    </span>
  );
}

export function ClueLegend({
  className = "flex flex-wrap items-center gap-x-4 gap-y-1.5 md:flex-col md:items-start md:gap-2.5",
}: {
  className?: string;
}) {
  return (
    <div className={`font-mono text-xs text-ink ${className}`}>
      <LegendItem color="var(--color-clue-green)" icon={<Check size={11} strokeWidth={3} />}>
        Right pigment &amp; cell
      </LegendItem>
      <LegendItem color="var(--color-clue-yellow)" icon={<ChevronsUpDown size={11} strokeWidth={3} />}>
        Right pigment, wrong cell
      </LegendItem>
    </div>
  );
}
