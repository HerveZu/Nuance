"use client";

import { useEffect, useState } from "react";

// Physical key positions, row by row across the three letter rows. Palette
// colours bind to these positions (matched against KeyboardEvent.code), so the
// shortcuts follow the user's keyboard layout regardless of the characters it
// produces.
export const KEY_CODES = [
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",
  "KeyN",
  "KeyM",
];

const FALLBACK_LABELS = [
  "Q",
  "W",
  "E",
  "R",
  "T",
  "Y",
  "U",
  "I",
  "O",
  "P",
  "A",
  "S",
  "D",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "Z",
  "X",
  "C",
  "V",
  "B",
  "N",
  "M",
];

interface KeyboardLayoutMap {
  get(code: string): string | undefined;
}
interface KeyboardWithMap {
  getLayoutMap?: () => Promise<KeyboardLayoutMap>;
}

// The character each physical position produces on the user's keyboard,
// resolved generically for any layout. The Keyboard Map API gives the full
// mapping upfront where available (Chromium); on every browser we also learn
// each position's character the first time it is pressed, so QWERTY, QWERTZ,
// AZERTY, Dvorak, etc. all label and bind correctly.
export function useKeyLabels(): string[] {
  const [labels, setLabels] = useState<string[]>(FALLBACK_LABELS);

  useEffect(() => {
    const keyboard = (navigator as Navigator & { keyboard?: KeyboardWithMap }).keyboard;
    if (keyboard?.getLayoutMap) {
      let cancelled = false;
      keyboard
        .getLayoutMap()
        .then((map) => {
          if (cancelled) return;
          setLabels(
            KEY_CODES.map((code, i) => (map.get(code) || FALLBACK_LABELS[i]).toUpperCase()),
          );
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    const onKey = (e: KeyboardEvent) => {
      const idx = KEY_CODES.indexOf(e.code);
      if (idx < 0 || e.key.length !== 1) return;
      const ch = e.key.toUpperCase();
      setLabels((prev) => {
        if (prev[idx] === ch) return prev;
        const next = prev.slice();
        next[idx] = ch;
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return labels;
}
