import { cn } from "@/lib/utils";

// The shared page frame: dark ground, app font, responsive padding, and a
// centred max-width column. `fill` switches to the game's locked-viewport
// layout (the board manages its own scrolling); the default is a normal
// min-height page used by e.g. the leaderboard.
export function PageShell({
  children,
  fill = false,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  fill?: boolean;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-ground text-ink font-ui p-4 md:p-5 md:pb-8",
        fill
          ? "h-[100svh] md:h-auto md:min-h-screen overflow-hidden md:overflow-visible flex flex-col"
          : "min-h-screen",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-235 mx-auto w-full",
          fill && "flex flex-1 min-h-0 flex-col",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
