"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { computeElo } from "../lib/elo";
import { FORMATS, generate, advance } from "../lib/tournament";
import { useApp } from "./AppProvider";
import { Modal, Button, Avatar } from "./ui";

const MIN_PER_GAME = 12; // rough minutes per game for the time estimate

// Estimate how many games a format will produce, for the duration hint.
function estimateGames(format, n, rounds, target) {
  if (n < 2) return 0;
  if (format === "duel") return target; // shortest possible; can run up to 2·target−1
  if (format === "round_robin") return (n * (n - 1)) / 2;
  if (format === "single_elim") return n - 1;
  if (format === "swiss") return rounds * Math.floor(n / 2);
  if (format === "groups_knockout") {
    const groups = n <= 8 ? 2 : n <= 12 ? 3 : 4;
    const per = Math.ceil(n / groups);
    const groupGames = groups * (per * (per - 1)) / 2;
    const advancing = groups * 2;
    return Math.round(groupGames + (advancing - 1));
  }
  return 0;
}

export function TournamentModal({ open, onClose }) {
  const { players, matches, load } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [format, setFormat] = useState("round_robin");
  const [picked, setPicked] = useState(() => new Set());
  const [rounds, setRounds] = useState(4);
  const [target, setTarget] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fmt = FORMATS.find((f) => f.id === format);
  const count = picked.size;
  const games = useMemo(
    () => estimateGames(format, count, rounds, target),
    [format, count, rounds, target]
  );

  function toggle(id) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function create(e) {
    e.preventDefault();
    const title = name.trim();
    if (!title) return setError("Give the tournament a name.");
    if (format === "duel") {
      if (count !== 2) return setError("Pick exactly 2 players for a duel.");
    } else if (count < fmt.min) {
      return setError(`Need at least ${fmt.min} players for ${fmt.name}.`);
    }

    setBusy(true);
    setError("");
    try {
      const ids = players.filter((p) => picked.has(p.id)).map((p) => p.id);
      const { rating } = computeElo(players, matches); // seed by current Elo
      let data = generate(format, ids, { rounds, target }, rating);
      data = advance(data, rating); // resolve any first-round byes

      const { data: row, error: err } = await supabase
        .from("tournaments")
        .insert({
          name: title,
          format,
          status: data.status,
          winner_id: data.winnerId || null,
          data,
        })
        .select()
        .single();
      if (err) throw err;

      load();
      onClose();
      router.push(`/tournament/${row.id}`);
    } catch (err) {
      setError(err.message || "Could not create tournament.");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New tournament">
      <form onSubmit={create} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fishing Office Open"
          maxLength={40}
          autoFocus
          className="w-full rounded-2xl bg-ink/5 px-4 py-3 font-semibold outline-none transition focus:bg-ink/10 focus:ring-2 focus:ring-ball/40"
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-2xl bg-ink/5 px-4 py-3 outline-none transition focus:ring-2 focus:ring-ball/40"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 px-1 text-xs text-ink/50">{fmt.blurb}</p>
        </div>

        {format === "duel" && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink/70">First to</label>
            <input
              type="number"
              min={1}
              max={50}
              value={target}
              onChange={(e) => setTarget(Math.max(1, Math.min(50, parseInt(e.target.value || "1", 10))))}
              className="w-20 rounded-xl bg-ink/5 px-3 py-2 text-center tabnum outline-none focus:ring-2 focus:ring-ball/40"
            />
            <span className="text-sm text-ink/50">game wins</span>
          </div>
        )}

        {format === "swiss" && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink/70">Rounds</label>
            <input
              type="number"
              min={2}
              max={12}
              value={rounds}
              onChange={(e) => setRounds(Math.max(2, Math.min(12, parseInt(e.target.value || "2", 10))))}
              className="w-20 rounded-xl bg-ink/5 px-3 py-2 text-center tabnum outline-none focus:ring-2 focus:ring-ball/40"
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-ink/70">Players</label>
            <span className="text-xs tabnum text-ink/50">{count} selected</span>
          </div>
          <div className="max-h-52 space-y-1 overflow-auto rounded-2xl bg-ink/5 p-1">
            {players.length === 0 && (
              <p className="px-3 py-3 text-sm text-ink/40">Add some players first.</p>
            )}
            {players.map((p) => {
              const on = picked.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    on ? "bg-ball/15" : "hover:bg-ink/5"
                  }`}
                >
                  <Avatar src={p.photo_url} name={p.nickname} size={28} />
                  <span className="font-medium">{p.nickname}</span>
                  <span className={`ml-auto ${on ? "text-ball" : "text-ink/20"}`}>
                    {on ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {format === "duel" ? (
          count === 2 && (
            <div className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/60">
              First to <span className="font-bold text-ink">{target}</span> wins ·{" "}
              <span className="font-bold text-ink">{target}</span>–
              <span className="font-bold text-ink">{2 * target - 1}</span> games. The app keeps
              dealing games until someone gets there. Every game counts toward Elo.
            </div>
          )
        ) : (
          count >= 2 && (
            <div className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/60">
              ≈ <span className="font-bold text-ink">{games}</span> games · about{" "}
              <span className="font-bold text-ink">
                {Math.max(1, Math.round((games * MIN_PER_GAME) / 60))}h
              </span>{" "}
              at the table. Players are seeded by current Elo.
            </div>
          )
        )}

        {error && <p className="text-sm font-medium text-ball">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
