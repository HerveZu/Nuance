import { ArrowRight } from "lucide-react";
import { getPigment, pureMix, rgbToCss, type Puzzle } from "@/lib/engine";
import { PrimaryButton } from "./ui/buttons";

export function LaunchScreen({ puzzle, onPlay }: { puzzle: Puzzle; onPlay: () => void }) {
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
            <div key={id} className="w-[72px] border border-line rounded-card overflow-hidden bg-surface">
              <div className="h-[42px]" style={{ background: rgbToCss(pureMix(id)) }} />
              <div className="px-1.5 py-1 text-left">
                <div className="font-medium text-2xs leading-[1.15] whitespace-nowrap overflow-hidden text-ellipsis">
                  {p.name}
                </div>
                <div className="font-mono text-2xs text-sub mt-px">{p.code}</div>
              </div>
            </div>
          );
        })}
      </div>
      <PrimaryButton onClick={onPlay} className="mx-auto inline-flex items-center gap-2 text-md tracking-[0.1em] px-[30px] py-3.5">
        Start mixing <ArrowRight size={16} />
      </PrimaryButton>
    </div>
  );
}
