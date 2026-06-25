"use client";

import { useApp } from "./AppProvider";

// Header control: log in as admin (to edit) or log back out.
export function AdminButton() {
  const { unlocked, ensure, lock } = useApp();

  return unlocked ? (
    <button
      onClick={lock}
      title="Log out of admin"
      className="rounded-full bg-ball/15 px-3 py-1.5 text-xs font-semibold text-ball transition hover:bg-ball/25"
    >
      🔓 Admin
    </button>
  ) : (
    <button
      onClick={() => ensure(() => {})}
      title="Admin login"
      className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-ink/10"
    >
      🔒 Admin
    </button>
  );
}
