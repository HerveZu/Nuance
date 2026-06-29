import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// The game's button look (distinct from the shadcn `button.tsx` used in the
// auth dialog): mono type, hairline border, card radius. Centralised here as a
// cva so the two variants and the recurring sizes live in one place — and so a
// `<Link>` can wear the exact same skin via `gameButtonVariants({...})`.
export const gameButtonVariants = cva(
  "font-mono border border-line rounded-card cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-ink text-surface uppercase",
        ghost: "bg-transparent text-ink",
      },
      size: {
        none: "",
        // The uppercase "Results / Sign in / Back to game" pill.
        pill: "text-sm tracking-wide uppercase px-3.5 py-[9px]",
        // The square nav / icon control (e.g. day prev/next, trophy link).
        icon: "size-control flex items-center justify-center",
      },
    },
    defaultVariants: { variant: "primary", size: "none" },
  },
);

type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<VariantProps<typeof gameButtonVariants>, "size">;

export function PrimaryButton({ className, size, ...props }: GameButtonProps) {
  return (
    <button
      {...props}
      className={cn(gameButtonVariants({ variant: "primary", size }), className)}
    />
  );
}

export function GhostButton({ className, size, ...props }: GameButtonProps) {
  return (
    <button {...props} className={cn(gameButtonVariants({ variant: "ghost", size }), className)} />
  );
}
