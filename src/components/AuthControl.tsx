"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthDialog } from "./AuthDialog";
import { GhostButton, gameButtonVariants } from "./ui/buttons";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AuthControl() {
  const { data: session, isPending } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const user = session?.user;

  return (
    <>
      <Link
        href="/leaderboard"
        title="Leaderboard"
        className={cn(gameButtonVariants({ variant: "ghost", size: "icon" }), "hover:bg-surface")}
      >
        <Trophy size={16} aria-label="Leaderboard" />
      </Link>

      {isPending ? null : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none" aria-label="Account">
            <PlayerAvatar
              name={user.name ?? user.email}
              image={user.image}
              className="size-control"
              fallbackClassName="bg-surface text-sm"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium max-w-[200px] truncate">{user.name ?? user.email}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut size={14} /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <GhostButton onClick={() => setAuthOpen(true)} size="pill">
          Sign in
        </GhostButton>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
