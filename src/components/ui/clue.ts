import { Check, ArrowLeftRight, type LucideIcon } from "lucide-react";
import type { Clue } from "@/lib/engine";

// Single source of truth for the two "positive" clues. The colour, icon, and
// human label live here so the board cells (ClueIcon), the legend (ClueLegend),
// and the results distribution all agree without re-declaring them.
export interface ClueMeta {
  colorVar: string;
  Icon: LucideIcon;
  label: string;
}

export const CLUE_META: Record<"green" | "yellow", ClueMeta> = {
  green: {
    colorVar: "var(--color-clue-green)",
    Icon: Check,
    label: "Right pigment & cell",
  },
  yellow: {
    colorVar: "var(--color-clue-yellow)",
    Icon: ArrowLeftRight,
    label: "Right pigment, wrong cell",
  },
};

export function hasClueIcon(clue: Clue): clue is "green" | "yellow" {
  return clue === "green" || clue === "yellow";
}
