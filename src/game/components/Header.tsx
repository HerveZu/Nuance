import { ChevronLeft, ChevronRight } from "lucide-react";
import { AuthControl } from "@/auth/AuthControl";
import { GhostButton } from "@/components/ui/buttons";
import { PageHeading } from "@/components/ui/PageHeading";

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

export function Header({
  num,
  dateLabel,
  isToday,
  canGoBack,
  finished,
  onPrev,
  onNext,
  onReopen,
}: HeaderProps) {
  return (
    <div className="flex items-end justify-between gap-x-6 gap-y-3 flex-wrap pb-2 mb-3 md:pb-3 md:mb-5 shrink-0">
      <PageHeading
        title={
          <>
            NUANCE<span className="text-sub">.day</span>
          </>
        }
        caption={
          <>
            #{num} · {dateLabel}
          </>
        }
      />
      <div className="flex gap-2 items-center">
        {finished && (
          <GhostButton onClick={onReopen} size="pill">
            Results
          </GhostButton>
        )}
        <GhostButton
          onClick={onPrev}
          disabled={!canGoBack}
          title="Previous day"
          size="icon"
          className="text-md disabled:opacity-[0.35]"
        >
          <ChevronLeft size={18} aria-label="Previous day" />
        </GhostButton>
        <GhostButton
          onClick={onNext}
          disabled={isToday}
          title="Next day"
          size="icon"
          className="text-md disabled:opacity-[0.35]"
        >
          <ChevronRight size={18} aria-label="Next day" />
        </GhostButton>
        <AuthControl />
      </div>
    </div>
  );
}
