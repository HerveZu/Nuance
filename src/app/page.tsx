import type { Metadata } from "next";
import Game from "@/game/Game";
import { Analytics } from "@vercel/analytics/next";
import { dayNumber, dateForOffset } from "@/game/daily";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: `Nuance.day #${dayNumber(dateForOffset(0))}` };
}

export default function Home() {
  return (
    <>
      <Analytics/>
      <Game/>
    </>
  );
}