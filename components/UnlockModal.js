"use client";

import { useState } from "react";
import { Modal, Button, PingBall } from "./ui";

// Password prompt shown when a locked visitor tries to edit anything.
export function UnlockModal({ open, onClose, onSubmit }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ok = await onSubmit(password.trim());
    if (!ok) {
      setError("Wrong password.");
      setBusy(false);
    } else {
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Admin login">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-ink/5 p-3 text-sm text-ink/60">
          <PingBall className="h-5 w-5 shrink-0" />
          Enter the admin password to add, edit, or delete anything.
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          className="w-full rounded-2xl bg-ink/5 px-4 py-3 outline-none transition focus:bg-ink/10 focus:ring-2 focus:ring-ball/40"
        />
        {error && <p className="text-sm font-medium text-ball">{error}</p>}
        <Button type="submit" variant="accent" className="w-full" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </Button>
      </form>
    </Modal>
  );
}
