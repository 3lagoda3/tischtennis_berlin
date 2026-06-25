"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Avatar } from "./ui";

function Stepper({ value, onChange }) {
  const set = (v) => onChange(Math.max(0, Math.min(99, v)));
  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" onClick={() => set(value - 1)} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-lg hover:bg-ink/10">−</button>
      <input
        type="number"
        value={value}
        onChange={(e) => set(parseInt(e.target.value || "0", 10))}
        className="w-16 rounded-2xl bg-ink/5 py-2 text-center text-2xl font-bold tabnum outline-none focus:ring-2 focus:ring-ball/40"
      />
      <button type="button" onClick={() => set(value + 1)} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-lg hover:bg-ink/10">+</button>
    </div>
  );
}

// Logs the score for a tournament fixture (players are fixed).
export function FixtureResultModal({ open, onClose, fixture, p1, p2, onSubmit }) {
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setS1(fixture?.score1 ?? 0);
    setS2(fixture?.score2 ?? 0);
    setError("");
    setBusy(false);
  }, [open, fixture]);

  async function submit(e) {
    e.preventDefault();
    if (s1 === s2) return setError("A game can't end in a draw.");
    setBusy(true);
    try {
      await onSubmit(s1, s2);
      onClose();
    } catch (err) {
      setError(err.message || "Could not save.");
      setBusy(false);
    }
  }

  if (!fixture) return null;

  return (
    <Modal open={open} onClose={onClose} title="Log result">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 flex-col items-center gap-1">
            <Avatar src={p1?.photo_url} name={p1?.nickname} size={44} />
            <span className="text-center text-sm font-semibold">{p1?.nickname}</span>
          </div>
          <span className="text-sm font-bold text-ink/30">vs</span>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Avatar src={p2?.photo_url} name={p2?.nickname} size={44} />
            <span className="text-center text-sm font-semibold">{p2?.nickname}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1"><Stepper value={s1} onChange={setS1} /></div>
          <span className="text-xl font-bold text-ink/30">:</span>
          <div className="flex-1"><Stepper value={s2} onChange={setS2} /></div>
        </div>

        {error && <p className="text-center text-sm font-medium text-ball">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
            {busy ? "Saving…" : "Save result"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
