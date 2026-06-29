import type { Metadata } from "next";
import { dateForOffset, dayNumber } from "@/game/daily";
import Game from "@/game/Game";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: `Nuance.day #${dayNumber(dateForOffset(0))}` };
}

export default function Home() {
  return <Game />;
}
