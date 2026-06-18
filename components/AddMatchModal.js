"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { winnerOf } from "../lib/standings";
import { Modal, Button } from "./ui";
import { PlayerPicker } from "./PlayerPicker";

// Stepper used for each side's score.
function ScoreField({ label, value, onChange }) {
  const set = (v) => onChange(Math.max(0, Math.min(99, v)));
  return (
    <div className="flex-1">
      <div className="mb-1.5 text-center text-sm font-medium text-ink/60">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => set(value - 1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-lg hover:bg-ink/10"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => set(parseInt(e.target.value || "0", 10))}
          className="w-16 rounded-2xl bg-ink/5 py-2 text-center text-2xl font-bold tabnum outline-none focus:ring-2 focus:ring-ball/40"
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-lg hover:bg-ink/10"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function AddMatchModal({ open, onClose, players, onAdded }) {
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setP1(null); setP2(null); setS1(0); setS2(0); setError(""); setBusy(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (!p1 || !p2) return setError("Pick both players.");
    if (p1 === p2) return setError("Pick two different players.");
    if (s1 === s2) return setError("A game can't end in a draw.");

    setBusy(true);
    setError("");
    try {
      const { error: insErr } = await supabase.from("matches").insert({
        player1_id: p1,
        player2_id: p2,
        score1: s1,
        score2: s2,
        winner_id: winnerOf(s1, s2, p1, p2),
      });
      if (insErr) throw insErr;
      reset();
      onAdded?.();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log a game">
      <form onSubmit={submit} className="space-y-4">
        <PlayerPicker players={players} value={p1} onChange={setP1} exclude={p2} placeholder="Player 1" />

        <div className="net-line h-0.5 text-ink/20" />

        <PlayerPicker players={players} value={p2} onChange={setP2} exclude={p1} placeholder="Player 2" />

        <div className="flex items-end gap-3 pt-1">
          <ScoreField label="Score" value={s1} onChange={setS1} />
          <span className="pb-3 text-xl font-bold text-ink/30">:</span>
          <ScoreField label="Score" value={s2} onChange={setS2} />
        </div>

        {error && <p className="text-center text-sm font-medium text-ball">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
            {busy ? "Saving…" : "Save game"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
