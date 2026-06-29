import { cn } from "@/lib/utils";

// Colour block for the target, the revealed recipe, and a guess's mixed
// result. `css` is any CSS colour value.
export function Swatch({
  css,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & { css: string }) {
  return (
    <div
      className={cn("border border-line rounded-card", className)}
      style={{ background: css, ...style }}
      {...props}
    />
  );
}
