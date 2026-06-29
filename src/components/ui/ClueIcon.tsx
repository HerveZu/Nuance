import type { Clue } from "@/lib/engine";
import { CLUE_META, hasClueIcon } from "./clue";

export { hasClueIcon };

export function ClueIcon({ clue, color, size }: { clue: Clue; color: string; size: number }) {
  if (!hasClueIcon(clue)) return null;
  const { Icon, label } = CLUE_META[clue];
  return <Icon size={size} strokeWidth={3} color={color} aria-label={label} />;
}
