"use client";

import { useMemo, useState } from "react";
import { headToHead } from "../lib/standings";
import { Avatar } from "./ui";
import { PlayerPicker } from "./PlayerPicker";

export function HeadToHead({ players, matches }) {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);

  const pa = players.find((p) => p.id === a);
  const pb = players.find((p) => p.id === b);
  const ready = pa && pb;

  const { games, wins1, wins2 } = useMemo(
    () => (ready ? headToHead(matches, a, b) : { games: [], wins1: 0, wins2: 0 }),
    [ready, matches, a, b]
  );

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink/50">
        Head to head
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <PlayerPicker players={players} value={a} onChange={setA} exclude={b} placeholder="Player 1" />
        </div>
        <span className="text-sm font-bold text-ink/30">vs</span>
        <div className="flex-1">
          <PlayerPicker players={players} value={b} onChange={setB} exclude={a} placeholder="Player 2" />
        </div>
      </div>

      {ready && (
        <div className="mt-5">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <Avatar src={pa.photo_url} name={pa.nickname} size={48} />
              <span className="text-sm font-medium">{pa.nickname}</span>
            </div>
            <div className="text-3xl font-black tabnum">
              <span className={wins1 >= wins2 ? "text-ball" : "text-ink/40"}>{wins1}</span>
              <span className="text-ink/20"> : </span>
              <span className={wins2 >= wins1 ? "text-ball" : "text-ink/40"}>{wins2}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Avatar src={pb.photo_url} name={pb.nickname} size={48} />
              <span className="text-sm font-medium">{pb.nickname}</span>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            {games.length === 0 && (
              <p className="text-center text-sm text-ink/40">No games between these two yet.</p>
            )}
            {games.map((m) => {
              const aLeft = m.player1_id === a;
              const sa = aLeft ? m.score1 : m.score2;
              const sb = aLeft ? m.score2 : m.score1;
              const aWon = m.winner_id === a;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-4 py-2.5 text-sm"
                >
                  <span className={`tabnum font-bold ${aWon ? "text-ink" : "text-ink/40"}`}>{sa}</span>
                  <span className="text-xs text-ink/40">
                    {new Date(m.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className={`tabnum font-bold ${!aWon ? "text-ink" : "text-ink/40"}`}>{sb}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
