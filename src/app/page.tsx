import type { Metadata } from "next";
import Game from "./Game";
import { Analytics } from "@vercel/analytics/next";
import { dayNumber, dateForOffset } from "@/lib/daily";

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