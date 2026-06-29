import { cn } from "@/lib/utils";

// The page title block shared by the game header and the leaderboard: a bold
// display title with an optional mono caption beside it.
export function PageHeading({
  title,
  caption,
  className,
}: {
  title: React.ReactNode;
  caption?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3.5 flex-wrap", className)}>
      <div className="font-display font-bold text-3xl tracking-[-0.03em]">{title}</div>
      {caption != null && (
        <div className="font-mono text-base text-sub tracking-caption">{caption}</div>
      )}
    </div>
  );
}
