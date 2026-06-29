import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// The signed-in user for the current request, or null. Used by server actions
// and the leaderboard page to decide what to record / highlight.
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
