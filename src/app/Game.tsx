"use client";

import { useEffect } from "react";
import { useNuance } from "@/hooks/useNuance";
import { Header } from "@/components/Header";
import { LaunchScreen } from "@/components/LaunchScreen";
import { PlayScreen } from "@/components/PlayScreen";
import { ResultsOverlay } from "@/components/ResultsOverlay";

export default function Game() {
  const n = useNuance();

  useEffect(() => {
    document.title = `Nuance.day #${n.puzzle.num}`;
  }, [n.puzzle.num]);

  if (!n.ready) return <div className="min-h-screen bg-ground" />;

  return (
    <div className="h-[100svh] md:h-auto md:min-h-screen overflow-hidden md:overflow-visible bg-ground text-ink font-ui p-4 md:p-5 md:pb-8 flex flex-col">
      <div className="max-w-235 mx-auto w-full flex flex-1 min-h-0 flex-col">
        <Header
          num={n.puzzle.num}
          dateLabel={n.dateLabel}
          isToday={n.isToday}
          canGoBack={n.canGoBack}
          finished={n.finished}
          onPrev={n.prevDay}
          onNext={n.nextDay}
          onReopen={n.reopen}
        />

        <div className="flex flex-1 min-h-0 flex-col md:justify-center">
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
