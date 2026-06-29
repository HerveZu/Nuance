import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/buttons";
import { Surface } from "@/components/ui/Surface";
import { rgbToCss } from "@/game/color";
import { getPigment, type PublicPuzzle, pureMix } from "@/game/engine";

export function LaunchScreen({ puzzle, onPlay }: { puzzle: PublicPuzzle; onPlay: () => void }) {
  return (
    <div className="text-center">
      <div className="font-mono text-sm tracking-[0.28em] text-sub mb-3">TODAY&apos;S PALETTE</div>
      <div className="font-display font-bold text-5xl leading-[1.02] tracking-[-0.02em] mb-2.5">
        {puzzle.theme.title}
      </div>
      <p className="text-lg text-sub mb-[26px] max-w-[420px] mx-auto">{puzzle.theme.sub}</p>
      <div className="flex gap-2.5 justify-center flex-wrap mb-7">
        {puzzle.palette.map((id) => {
          const p = getPigment(id);
          return (
            <Surface key={id} className="w-[72px] overflow-hidden">
              <div className="h-row" style={{ background: rgbToCss(pureMix(id)) }} />
              <div className="px-1.5 py-1 text-left">
                <div className="font-medium text-2xs leading-[1.15] whitespace-nowrap overflow-hidden text-ellipsis">
                  {p.name}
                </div>
                <div className="text-meta mt-px">{p.code}</div>
              </div>
            </Surface>
          );
        })}
      </div>
      <PrimaryButton
        onClick={onPlay}
        className="mx-auto inline-flex items-center gap-2 text-md tracking-label px-[30px] py-3.5"
      >
        Start mixing <ArrowRight size={16} />
      </PrimaryButton>
    </div>
  );
}
