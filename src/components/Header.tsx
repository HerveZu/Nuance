import { ChevronLeft, ChevronRight } from "lucide-react";
import { GhostButton } from "./ui/buttons";

interface HeaderProps {
  num: number | string;
  dateLabel: string;
  isToday: boolean;
  canGoBack: boolean;
  finished: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReopen: () => void;
}

export function Header({ num, dateLabel, isToday, canGoBack, finished, onPrev, onNext, onReopen }: HeaderProps) {
  return (
    <div className="flex items-end justify-between gap-x-6 gap-y-3 flex-wrap pb-3 mb-5">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <div className="font-display font-bold text-3xl tracking-[-0.03em]">
          NUANCE<span className="text-sub">.day</span>
        </div>
        <div className="font-mono text-base text-sub tracking-[0.06em]">
          #{num} · {dateLabel}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {finished && (
          <GhostButton onClick={onReopen} className="text-sm tracking-[0.08em] uppercase px-3.5 py-[9px]">
            Results
          </GhostButton>
        )}
        <GhostButton
          onClick={onPrev}
          disabled={!canGoBack}
          title="Previous day"
          className="text-md w-[38px] h-[38px] flex items-center justify-center disabled:opacity-[0.35]"
        >
          <ChevronLeft size={18} aria-label="Previous day" />
        </GhostButton>
        <GhostButton
          onClick={onNext}
          disabled={isToday}
          title="Next day"
          className="text-md w-[38px] h-[38px] flex items-center justify-center disabled:opacity-[0.35]"
        >
          <ChevronRight size={18} aria-label="Next day" />
        </GhostButton>
      </div>
    </div>
  );
}
