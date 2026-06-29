import { Check, ArrowLeftRight } from "lucide-react";
import type { Clue } from "@/lib/engine";

export function hasClueIcon(clue: Clue): boolean {
  return clue === "green" || clue === "yellow";
}

export function ClueIcon({ clue, color, size }: { clue: Clue; color: string; size: number }) {
  if (clue === "green") return <Check size={size} strokeWidth={3} color={color} aria-label="Right pigment and cell" />;
  if (clue === "yellow") return <ArrowLeftRight size={size} strokeWidth={3} color={color} aria-label="Right pigment, wrong cell" />;
  return null;
}
