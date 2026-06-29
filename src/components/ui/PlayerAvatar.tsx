import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Player avatar with a two-letter initials fallback. `className` sizes it;
// `fallbackClassName` tunes the fallback's background/size per context.
export function PlayerAvatar({
  name,
  image,
  className,
  fallbackClassName,
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={cn("border border-line", className)}>
      {image && <AvatarImage src={image} alt={name ?? "you"} />}
      <AvatarFallback className={cn("text-ink font-mono uppercase", fallbackClassName)}>
        {(name || "?").slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
}
