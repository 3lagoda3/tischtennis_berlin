"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { formatName } from "../lib/tournament";
import { Avatar } from "./ui";
import { TournamentModal } from "./TournamentModal";

export function Tournaments() {
  const { tournaments, players, unlocked, ensure } = useApp();
  const [open, setOpen] = useState(false);
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-ink/50">Tournaments</h2>
        {unlocked && (
          <button
            onClick={() => ensure(() => setOpen(true))}
            className="rounded-full bg-ball px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ball/90"
          >
            + New
          </button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink/40">
          No tournaments yet.{!unlocked && " Log in as admin to start one."}
        </p>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => {
            const champ = t.winner_id ? byId[t.winner_id] : null;
            return (
              <Link
                key={t.id}
                href={`/tournament/${t.id}`}
                className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] px-4 py-3 transition hover:bg-ink/[0.06]"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold">{t.name}</div>
                  <div className="text-xs text-ink/50">{formatName(t.format)}</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {t.status === "completed" ? (
                    champ ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-ball/15 px-2.5 py-1 text-xs font-semibold text-ball">
                        🏆
                        <Avatar src={champ.photo_url} name={champ.nickname} size={18} />
                        {champ.nickname}
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/50">
                        Done
                      </span>
                    )
                  ) : (
                    <span className="rounded-full bg-ball/15 px-2.5 py-1 text-xs font-semibold text-ball">
                      Live
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <TournamentModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
