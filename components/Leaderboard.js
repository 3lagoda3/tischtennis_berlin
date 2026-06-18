"use client";

import { Avatar } from "./ui";

function medal(rank) {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
}

export function Leaderboard({ rows }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-3xl bg-paper p-10 text-center shadow-sm ring-1 ring-ink/10">
        <p className="text-ink/50">No players yet.</p>
        <p className="mt-1 text-sm text-ink/40">Hit “Add player” to start the championship.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-ink/10">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-ink/40">
            <th className="py-3 pl-5 pr-2 font-semibold">#</th>
            <th className="py-3 px-2 font-semibold">Player</th>
            <th className="py-3 px-2 text-center font-semibold">P</th>
            <th className="py-3 px-2 text-center font-semibold">W</th>
            <th className="py-3 px-2 text-center font-semibold">L</th>
            <th className="hidden px-2 text-center font-semibold sm:table-cell">Win%</th>
            <th className="py-3 pl-2 pr-5 text-right font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t border-ink/5 transition hover:bg-ink/[0.02]"
            >
              <td className="py-3 pl-5 pr-2">
                <span className="tabnum font-bold text-ink/40">
                  {medal(r.rank) || r.rank}
                </span>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                  <Avatar src={r.photo_url} name={r.nickname} size={34} />
                  <span className="font-semibold">{r.nickname}</span>
                </div>
              </td>
              <td className="py-3 px-2 text-center tabnum text-ink/60">{r.played}</td>
              <td className="py-3 px-2 text-center tabnum font-semibold">{r.won}</td>
              <td className="py-3 px-2 text-center tabnum text-ink/60">{r.lost}</td>
              <td className="hidden px-2 text-center tabnum text-ink/60 sm:table-cell">
                {r.played ? Math.round(r.winRate * 100) + "%" : "—"}
              </td>
              <td className="py-3 pl-2 pr-5 text-right">
                <span className="tabnum text-lg font-black text-ball">{r.points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
