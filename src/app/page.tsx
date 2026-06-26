import Game from "./Game";
import { Analytics } from "@vercel/analytics/next";

export default function Home() {
  return (
    <>
      <Analytics/>
      <Game/>
    </>
  );
}