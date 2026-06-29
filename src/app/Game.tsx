"use client";

import { useNuance } from "@/hooks/useNuance";
import { Header } from "@/components/Header";
import { LaunchScreen } from "@/components/LaunchScreen";
import { PlayScreen } from "@/components/PlayScreen";
import { ResultsOverlay } from "@/components/ResultsOverlay";

export default function Game() {
  const n = useNuance();

  if (!n.ready) return <div className="min-h-screen bg-ground" />;

  return (
    <div className="min-h-screen bg-ground text-ink font-ui p-5 pb-8 flex flex-col">
      <div className="max-w-235 mx-auto w-full flex flex-1 flex-col">
        <Header
          dateLabel={n.dateLabel}
          isToday={n.isToday}
          canGoBack={n.canGoBack}
          finished={n.finished}
          onPrev={n.prevDay}
          onNext={n.nextDay}
          onReopen={n.reopen}
        />

        <div className="flex flex-1 flex-col justify-center">
          {n.screen === "launch" && <LaunchScreen puzzle={n.puzzle} onPlay={n.startPlay} />}

          {n.screen === "play" && (
            <PlayScreen
              puzzle={n.puzzle}
              composition={n.composition}
              board={n.board}
              finished={n.finished}
              addDose={n.addDose}
              removeDose={n.removeDose}
              submit={n.submit}
            />
          )}
        </div>
      </div>

      {n.overlayOpen && (
        <ResultsOverlay
          puzzle={n.puzzle}
          board={n.board}
          won={n.status === "won"}
          free={n.free}
          stats={n.stats}
          copied={n.copied}
          onClose={n.closeOverlay}
          onShare={n.share}
        />
      )}
    </div>
  );
}
