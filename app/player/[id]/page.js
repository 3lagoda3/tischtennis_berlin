"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "../../../components/AppProvider";
import { buildStandings, playerProfile } from "../../../lib/standings";
import {
  Avatar,
  Button,
  IconButton,
  FormDots,
  StreakBadge,
  TrophyBadge,
  PingBall,
} from "../../../components/ui";
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

export default function PlayerPage() {
  const { id } = useParams();
  const { players, matches, tournaments, loading, load, unlocked, ensure } = useApp();
  const [editPlayer, setEditPlayer] = useState(false);
  const [editMatch, setEditMatch] = useState(null);
  const [openOpp, setOpenOpp] = useState(null); // expanded head2head opponent id

  const player = players.find((p) => p.id === id);
  const row = useMemo(
    () => buildStandings(players, matches, tournaments).find((r) => r.id === id),
    [players, matches, tournaments, id]
  );
  const { games, opponents, nemesis, bunny } = useMemo(
    () => playerProfile(players, matches, id),
    [players, matches, id]
  );

  if (loading) return <p className="py-24 text-center text-ink/40">Loading…</p>;

  if (!player) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink/50">Player not found.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-ball">← Back to the table</Link>
      </main>
    );
  }

  const gamesVs = (oppId) => games.filter((g) => g.oppId === oppId);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink/50 hover:text-ink">
          <PingBall className="h-4 w-4" /> Back to table
        </Link>
        {unlocked && (
          <Button variant="ghost" onClick={() => ensure(() => setEditPlayer(true))}>
            ✎ Edit
          </Button>
        )}
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4">
        <Avatar src={player.photo_url} name={player.nickname} size={80} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight">{player.nickname}</h1>
            <TrophyBadge titles={row?.titles} />
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink/50">
            <span className="font-semibold">Rank #{row?.rank ?? "—"}</span>
            <StreakBadge streak={row?.streak ?? 0} />
            <FormDots results={row?.last5 ?? []} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Elo" value={row?.played ? row.eloRounded : "—"} accent />
        <Stat label="Games" value={row?.played ?? 0} />
        <Stat label="Won" value={row?.won ?? 0} />
        <Stat label="Lost" value={row?.lost ?? 0} />
        <Stat label="Win%" value={row?.played ? Math.round(row.winRate * 100) + "%" : "—"} />
        <Stat label="Diff" value={(row?.diff ?? 0) > 0 ? `+${row.diff}` : row?.diff ?? 0} />
      </div>

      {/* Rivalries */}
      {(bunny || nemesis) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {bunny && (
            <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
              <Avatar src={bunny.opponent.photo_url} name={bunny.opponent.nickname} size={36} />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-ink/40">Favourite victim</div>
                <div className="truncate text-sm font-semibold">{bunny.opponent.nickname}</div>
              </div>
              <div className="ml-auto tabnum text-sm font-bold text-ink/60">{bunny.won}–{bunny.lost}</div>
            </div>
          )}
          {nemesis && (
            <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
              <Avatar src={nemesis.opponent.photo_url} name={nemesis.opponent.nickname} size={36} />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-ink/40">Nemesis</div>
                <div className="truncate text-sm font-semibold">{nemesis.opponent.nickname}</div>
              </div>
              <div className="ml-auto tabnum text-sm font-bold text-ink/60">{nemesis.won}–{nemesis.lost}</div>
            </div>
          )}
        </div>
      )}

      {/* head2head */}
      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-widest text-ink/50">
        head2head ({games.length} games)
      </h2>
      {opponents.length === 0 ? (
        <p className="text-sm text-ink/40">No games yet.</p>
      ) : (
        <div className="space-y-1.5">
          {opponents
            .slice()
            .sort((a, b) => b.played - a.played)
            .map((o) => {
              const open = openOpp === o.opponent.id;
              const lead = o.won === o.lost ? "even" : o.won > o.lost ? "up" : "down";
              return (
                <div key={o.opponent.id} className="overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-ink/5">
                  <button
                    onClick={() => setOpenOpp(open ? null : o.opponent.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink/[0.02]"
                  >
                    <Avatar src={o.opponent.photo_url} name={o.opponent.nickname} size={32} />
                    <span className="font-semibold">{o.opponent.nickname}</span>
                    <span
                      className={`ml-auto tabnum text-sm font-bold ${
                        lead === "up" ? "text-ball" : lead === "down" ? "text-ink/40" : "text-ink/60"
                      }`}
                    >
                      {o.won}–{o.lost}
                    </span>
                    <span className="text-ink/30">{open ? "▴" : "▾"}</span>
                  </button>
                  {open && (
                    <div className="space-y-1 border-t border-ink/5 px-3 py-2">
                      {gamesVs(o.opponent.id).map((g) => (
                        <div key={g.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm">
                          <span className={`tabnum font-bold ${g.won ? "text-ball" : "text-ink/40"}`}>{g.my}</span>
                          <span className="text-ink/30">:</span>
                          <span className={`tabnum font-bold ${!g.won ? "text-ink" : "text-ink/40"}`}>{g.opp}</span>
                          {g.raw.tournament_id && <span className="text-[10px] uppercase tracking-wide text-ball/70">cup</span>}
                          <span className="ml-auto text-xs text-ink/40">
                            {new Date(g.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                          {unlocked && (
                            <IconButton label="Edit game" onClick={() => ensure(() => setEditMatch(g.raw))}>
                              ✎
                            </IconButton>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <PlayerModal open={editPlayer} player={player} onClose={() => setEditPlayer(false)} onSaved={load} />
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
