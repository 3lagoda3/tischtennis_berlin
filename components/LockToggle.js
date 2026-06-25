"use client";

import { useApp } from "./AppProvider";

// Tiny header chip showing edit state. Only rendered when protection is on.
export function LockToggle() {
  const { editProtected, unlocked, ensure, lock } = useApp();
  if (!editProtected) return null;

  return unlocked ? (
    <button
      onClick={lock}
      title="Lock editing"
      className="rounded-full bg-ball/15 px-3 py-1.5 text-xs font-semibold text-ball transition hover:bg-ball/25"
    >
      🔓 Editing
    </button>
  ) : (
    <button
      onClick={() => ensure(() => {})}
      title="Unlock editing"
      className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-ink/10"
    >
      🔒 Locked
    </button>
  );
}
