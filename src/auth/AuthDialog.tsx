"use client";

import { useState } from "react";
import { signIn, signUp } from "@/auth/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await signUp.email({ name: name || email.split("@")[0], email, password })
          : await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message || "Something went wrong.");
      } else {
        onOpenChange(false);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const discord = async () => {
    setError(null);
    await signIn.social({ provider: "discord", callbackURL: window.location.href });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-[-0.01em]">
            {mode === "signup" ? "Create account" : "Sign in"}
          </DialogTitle>
          <DialogDescription className="font-mono text-sub">
            Compete on the global leaderboard and sync your streak.
          </DialogDescription>
        </DialogHeader>

        <Button type="button" variant="outline" className="w-full" onClick={discord}>
          Continue with Discord
        </Button>

        <div className="flex items-center gap-3 text-label text-sub">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-name">Display name</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "signup" ? "signin" : "signup");
          }}
          className="text-sm text-sub hover:text-ink font-mono cursor-pointer"
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
