"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { AuthDialog } from "./AuthDialog";
import { GhostButton } from "./ui/buttons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
        className="font-mono border border-line rounded-card bg-transparent text-ink w-[38px] h-[38px] flex items-center justify-center hover:bg-surface"
      >
        <Trophy size={16} aria-label="Leaderboard" />
      </Link>

      {isPending ? null : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none" aria-label="Account">
            <Avatar className="h-[38px] w-[38px] border border-line">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? "you"} />}
              <AvatarFallback className="bg-surface text-ink font-mono text-sm uppercase">
                {(user.name ?? user.email ?? "?").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
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
        <GhostButton
          onClick={() => setAuthOpen(true)}
          className="text-sm tracking-[0.08em] uppercase px-3.5 py-[9px]"
        >
          Sign in
        </GhostButton>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
