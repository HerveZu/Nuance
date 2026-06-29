import { cn } from "@/lib/utils";

// Surface-tone card container: results modal, stat/info boxes, leaderboard
// table, launch swatch cards.
export function Surface({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("border border-line rounded-card bg-surface", className)} {...props} />;
}
