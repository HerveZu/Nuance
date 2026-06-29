export function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`font-mono text-sm tracking-section text-sub ${className}`}>{children}</div>
  );
}
