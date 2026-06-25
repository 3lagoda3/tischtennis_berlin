"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { winnerOf } from "../lib/standings";
import { Modal, Button } from "./ui";
import { PlayerPicker } from "./PlayerPicker";

// Stepper used for each side's score.
function ScoreField({ value, onChange }) {
  const set = (v) => onChange(Math.max(0, Math.min(99, v)));
  return (
    <div className="flex-1">
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

// Handles both "log a game" and "edit game" (when `match` is passed).
export function MatchModal({ open, onClose, players, onSaved, match }) {
  const editing = Boolean(match);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setP1(match?.player1_id || null);
    setP2(match?.player2_id || null);
    setS1(match?.score1 ?? 0);
    setS2(match?.score2 ?? 0);
    setConfirmDel(false);
    setError("");
    setBusy(false);
  }, [open, match]);

  async function submit(e) {
    e.preventDefault();
    if (!p1 || !p2) return setError("Pick both players.");
    if (p1 === p2) return setError("Pick two different players.");
    if (s1 === s2) return setError("A game can't end in a draw.");

    setBusy(true);
    setError("");
    const row = {
      player1_id: p1,
      player2_id: p2,
      score1: s1,
      score2: s2,
      winner_id: winnerOf(s1, s2, p1, p2),
    };
    try {
      const q = editing
        ? supabase.from("matches").update(row).eq("id", match.id)
        : supabase.from("matches").insert(row);
      const { error: err } = await q;
      if (err) throw err;
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const { error: err } = await supabase.from("matches").delete().eq("id", match.id);
      if (err) throw err;
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit game" : "Log a game"}>
      <form onSubmit={submit} className="space-y-4">
        <PlayerPicker players={players} value={p1} onChange={setP1} exclude={p2} placeholder="Player 1" />
        <div className="net-line h-0.5 text-ink/20" />
        <PlayerPicker players={players} value={p2} onChange={setP2} exclude={p1} placeholder="Player 2" />

        <div className="flex items-center gap-3 pt-1">
          <ScoreField value={s1} onChange={setS1} />
          <span className="text-xl font-bold text-ink/30">:</span>
          <ScoreField value={s2} onChange={setS2} />
        </div>

        {error && <p className="text-center text-sm font-medium text-ball">{error}</p>}

        {confirmDel ? (
          <div className="space-y-2 rounded-2xl bg-ball/10 p-3">
            <p className="text-sm font-medium text-ink">Delete this game for good?</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfirmDel(false)}>
                Keep
              </Button>
              <Button type="button" variant="accent" className="flex-1" disabled={busy} onClick={remove}>
                {busy ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            {editing && (
              <Button type="button" variant="danger" onClick={() => setConfirmDel(true)}>
                Delete
              </Button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save" : "Save game"}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
