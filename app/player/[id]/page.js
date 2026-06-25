"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "../../../components/AppProvider";
import { buildStandings, playerProfile } from "../../../lib/standings";
import { Avatar, Button, IconButton, FormDots, StreakBadge, PingBall } from "../../../components/ui";
import { PlayerModal } from "../../../components/PlayerModal";
import { MatchModal } from "../../../components/MatchModal";

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-ink/[0.03] px-3 py-3 text-center">
      <div className={`text-xl font-black tabnum ${accent ? "text-ball" : ""}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-ink/40">{label}</div>
    </div>
  );
}

function VsCard({ title, rec }) {
  if (!rec) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
      <Avatar src={rec.opponent.photo_url} name={rec.opponent.nickname} size={36} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ink/40">{title}</div>
        <div className="truncate text-sm font-semibold">{rec.opponent.nickname}</div>
      </div>
      <div className="ml-auto tabnum text-sm font-bold text-ink/60">
        {rec.won}–{rec.lost}
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const { id } = useParams();
  const { players, matches, loading, load, ensure } = useApp();
  const [editPlayer, setEditPlayer] = useState(false);
  const [editMatch, setEditMatch] = useState(null);

  const player = players.find((p) => p.id === id);
  const row = useMemo(
    () => buildStandings(players, matches).find((r) => r.id === id),
    [players, matches, id]
  );
  const { games, nemesis, bunny } = useMemo(
    () => playerProfile(players, matches, id),
    [players, matches, id]
  );

  if (loading) {
    return <p className="py-24 text-center text-ink/40">Loading…</p>;
  }

  if (!player) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink/50">Player not found.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-ball">
          ← Back to the table
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink/50 hover:text-ink">
          <PingBall className="h-4 w-4" /> Back to table
        </Link>
        <Button variant="ghost" onClick={() => ensure(() => setEditPlayer(true))}>
          ✎ Edit
        </Button>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4">
        <Avatar src={player.photo_url} name={player.nickname} size={80} />
        <div>
          <h1 className="text-2xl font-black tracking-tight">{player.nickname}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink/50">
            <span className="font-semibold">Rank #{row?.rank ?? "—"}</span>
            <StreakBadge streak={row?.streak ?? 0} />
            <FormDots results={row?.last5 ?? []} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Points" value={row?.points ?? 0} accent />
        <Stat label="Played" value={row?.played ?? 0} />
        <Stat label="Won" value={row?.won ?? 0} />
        <Stat label="Lost" value={row?.lost ?? 0} />
        <Stat label="Win%" value={row?.played ? Math.round(row.winRate * 100) + "%" : "—"} />
        <Stat label="Diff" value={(row?.diff ?? 0) > 0 ? `+${row.diff}` : row?.diff ?? 0} />
      </div>

      {/* Rivalries */}
      {(bunny || nemesis) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <VsCard title="Favourite victim" rec={bunny} />
          <VsCard title="Nemesis" rec={nemesis} />
        </div>
      )}

      {/* Match history */}
      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-widest text-ink/50">
        All games ({games.length})
      </h2>
      <div className="space-y-1.5">
        {games.length === 0 && <p className="text-sm text-ink/40">No games yet.</p>}
        {games.map((g) => (
          <div
            key={g.id}
            className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 shadow-sm ring-1 ring-ink/5"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                g.won ? "bg-ball/15 text-ball" : "bg-ink/10 text-ink/40"
              }`}
            >
              {g.won ? "W" : "L"}
            </span>
            <span className="text-sm text-ink/50">vs</span>
            <Link
              href={`/player/${g.oppId}`}
              className="flex min-w-0 items-center gap-2 hover:text-ball"
            >
              <Avatar src={g.opponent?.photo_url} name={g.opponent?.nickname} size={26} />
              <span className="truncate text-sm font-semibold">
                {g.opponent?.nickname || "Deleted player"}
              </span>
            </Link>
            <span className="ml-auto tabnum text-base font-bold">
              <span className={g.won ? "text-ball" : ""}>{g.my}</span>
              <span className="text-ink/30">:</span>
              <span className={!g.won ? "text-ink" : "text-ink/40"}>{g.opp}</span>
            </span>
            <IconButton label="Edit game" onClick={() => ensure(() => setEditMatch(g.raw))}>
              ✎
            </IconButton>
          </div>
        ))}
      </div>

      <PlayerModal
        open={editPlayer}
        player={player}
        onClose={() => setEditPlayer(false)}
        onSaved={load}
      />
      <MatchModal
        open={Boolean(editMatch)}
        match={editMatch}
        players={players}
        onClose={() => setEditMatch(null)}
        onSaved={load}
      />
    </main>
  );
}
