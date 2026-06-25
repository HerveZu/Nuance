type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-mono uppercase border border-line rounded-card bg-ink text-surface cursor-pointer disabled:cursor-not-allowed ${className}`}
    />
  );
}

export function GhostButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-mono border border-line rounded-card bg-transparent text-ink cursor-pointer disabled:cursor-not-allowed ${className}`}
    />
  );
}
