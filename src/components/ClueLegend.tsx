import { CLUE_META } from "./ui/clue";

const CLUES = ["green", "yellow"] as const;

export function ClueLegend({
  className = "flex flex-wrap items-center gap-x-4 gap-y-1.5 md:flex-col md:items-start md:gap-2.5",
}: {
  className?: string;
}) {
  return (
    <div className={`font-mono text-xs text-ink ${className}`}>
      {CLUES.map((clue) => {
        const { colorVar, Icon, label } = CLUE_META[clue];
        return (
          <span key={clue} className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="size-[18px] rounded-full text-clue-fg flex items-center justify-center shrink-0"
              style={{ background: colorVar }}
            >
              <Icon size={11} strokeWidth={3} />
            </span>
            {label}
          </span>
        );
      })}
    </div>
  );
}
