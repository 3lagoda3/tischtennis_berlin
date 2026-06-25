"use client";

import { useMemo, useState } from "react";
import { useApp } from "../components/AppProvider";
import { buildStandings } from "../lib/standings";
import { PingBall, Button } from "../components/ui";
import { Podium } from "../components/Podium";
import { Leaderboard } from "../components/Leaderboard";
import { RecentGames } from "../components/RecentGames";
import { HeadToHead } from "../components/HeadToHead";
import { PlayerModal } from "../components/PlayerModal";
import { MatchModal } from "../components/MatchModal";
import { LockToggle } from "../components/LockToggle";
import { SetupNotice } from "../components/SetupNotice";

export default function Page() {
  const { players, matches, loading, load, isConfigured, ensure } = useApp();
  const [playerModal, setPlayerModal] = useState(false);
  const [matchModal, setMatchModal] = useState(null); // false | true(new) | match(edit)

  const standings = useMemo(() => buildStandings(players, matches), [players, matches]);
  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!isConfigured) return <SetupNotice />;

  const openMatch = (m) => ensure(() => setMatchModal(m ?? true));
  const editMatch = (m) => ensure(() => setMatchModal(m));

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8 sm:pt-12">
      <header className="mb-8 flex items-center gap-3">
        <PingBall className="h-9 w-9" />
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight">Berlin Pong</h1>
          <p className="text-sm font-medium text-ink/50">Summer Championship ’26</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LockToggle />
          <div className="hidden rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold tabnum text-ink/60 sm:block">
            {players.length} players · {matches.length} games
          </div>
        </div>
      </header>

      {loading ? (
        <p className="py-16 text-center text-ink/40">Loading the table…</p>
      ) : (
        <div className="space-y-6">
          <Podium rows={standings} />
          <Leaderboard rows={standings} />
          <RecentGames matches={matches} byId={byId} onEdit={editMatch} />
          <HeadToHead players={players} matches={matches} />
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="net-line h-0.5 text-ink/15" />
        <div className="bg-paper/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => ensure(() => setPlayerModal(true))}>
              + Add player
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => openMatch()}
              disabled={players.length < 2}
            >
              + Log a game
            </Button>
          </div>
        </div>
      </div>

      <PlayerModal open={playerModal} onClose={() => setPlayerModal(false)} onSaved={load} />
      <MatchModal
        open={Boolean(matchModal)}
        match={typeof matchModal === "object" ? matchModal : null}
        onClose={() => setMatchModal(false)}
        players={players}
        onSaved={load}
      />
    </main>
  );
}
