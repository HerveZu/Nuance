"use client";

import { useEffect } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { Header } from "@/game/components/Header";
import { LaunchScreen } from "@/game/components/LaunchScreen";
import { PlayScreen } from "@/game/components/PlayScreen";
import { ResultsOverlay } from "@/game/components/ResultsOverlay";
import { useNuance } from "@/game/useNuance";

export default function Game() {
  const n = useNuance();
  const num = n.puzzle?.num;

  useEffect(() => {
    if (num != null) document.title = `Nuance.day #${num}`;
  }, [num]);

  if (!n.ready || !n.puzzle) return <div className="min-h-screen bg-ground" />;

  return (
    <PageShell fill>
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

      {n.overlayOpen && n.recipe && (
        <ResultsOverlay
          puzzle={n.puzzle}
          board={n.board}
          recipe={n.recipe}
          won={n.status === "won"}
          isToday={n.isToday}
          signedIn={n.signedIn}
          myStats={n.myStats}
          anonStats={n.anonStats}
          copied={n.copied}
          onClose={n.closeOverlay}
          onShare={n.share}
        />
      )}
    </PageShell>
  );
}
