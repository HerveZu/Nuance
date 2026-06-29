"use client";

import { LogOut, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthDialog } from "@/auth/AuthDialog";
import { signOut, useSession } from "@/auth/auth-client";
import { GhostButton, gameButtonVariants } from "@/components/ui/buttons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { cn } from "@/lib/utils";

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
          <DropdownMenuTrigger
            className="cursor-pointer rounded-full outline-none"
            aria-label="Account"
          >
            <PlayerAvatar
              name={user.name ?? user.email}
              image={user.image}
              className="size-control"
              fallbackClassName="bg-surface text-sm"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium max-w-[200px] truncate">
              {user.name ?? user.email}
            </div>
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
