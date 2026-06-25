"use client";

import Link from "next/link";
import { Avatar, IconButton } from "./ui";

function when(ts) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// Side of a single game — avatar, name (links to profile), score.
function Side({ player, score, won, align }) {
  const inner = (
    <>
      <Avatar src={player?.photo_url} name={player?.nickname} size={28} />
      <span className="truncate text-sm font-medium">{player?.nickname || "—"}</span>
    </>
  );
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      {player ? (
        <Link href={`/player/${player.id}`} className="flex min-w-0 items-center gap-2 hover:text-ball">
          {inner}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-2 opacity-60">{inner}</div>
      )}
      <span className={`tabnum text-lg font-black ${won ? "text-ball" : "text-ink/30"}`}>{score}</span>
    </div>
  );
}

export function RecentGames({ matches, byId, onEdit, limit = 8 }) {
  const games = matches.slice(0, limit);
  if (games.length === 0) return null;

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink/50">Recent games</h2>
      <div className="space-y-1">
        {games.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-ink/[0.03]"
          >
            <Side player={byId[m.player1_id]} score={m.score1} won={m.winner_id === m.player1_id} />
            <div className="flex shrink-0 flex-col items-center px-1">
              <span className="text-[10px] uppercase tracking-wider text-ink/30">{when(m.created_at)}</span>
              <span className="text-xs font-bold text-ink/20">vs</span>
            </div>
            <Side player={byId[m.player2_id]} score={m.score2} won={m.winner_id === m.player2_id} align="right" />
            {onEdit && (
              <IconButton label="Edit game" onClick={() => onEdit(m)}>
                ✎
              </IconButton>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
