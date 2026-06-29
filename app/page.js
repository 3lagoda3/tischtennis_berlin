"use client";

import { useMemo, useState } from "react";
import { useApp } from "../components/AppProvider";
import { buildStandings } from "../lib/standings";
import { PingBall, Button } from "../components/ui";
import { Podium } from "../components/Podium";
import { Leaderboard } from "../components/Leaderboard";
import { Tournaments } from "../components/Tournaments";
import { RecentGames } from "../components/RecentGames";
import { Gallery } from "../components/Gallery";
import { Subscribe } from "../components/Subscribe";
import { Changelog } from "../components/Changelog";
import { PlayerModal } from "../components/PlayerModal";
import { MatchModal } from "../components/MatchModal";
import { AdminButton } from "../components/AdminButton";
import { ThemeToggle } from "../components/ThemeToggle";
import { SetupNotice } from "../components/SetupNotice";

export default function Page() {
  const { players, matches, tournaments, loading, load, isConfigured, unlocked, ensure } = useApp();
  const [playerModal, setPlayerModal] = useState(false);
  const [matchModal, setMatchModal] = useState(false); // false | true(new) | match(edit)

  const standings = useMemo(
    () => buildStandings(players, matches, tournaments),
    [players, matches, tournaments]
  );
  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!isConfigured) return <SetupNotice />;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8 sm:pt-12">
      <header className="mb-8 flex items-center gap-3">
        <PingBall className="h-9 w-9" />
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight">Berlin Pong</h1>
          <p className="text-sm font-medium text-ink/50">Summer Championship ’26</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <AdminButton />
        </div>
      </header>

      {loading ? (
        <p className="py-16 text-center text-ink/40">Loading the table…</p>
      ) : (
        <div className="space-y-6">
          <Podium rows={standings} />
          <Leaderboard rows={standings} />
          <Tournaments />
          <RecentGames matches={matches} byId={byId} onEdit={unlocked ? (m) => ensure(() => setMatchModal(m)) : null} />
          <Gallery />
          <Subscribe />
          <Changelog />
        </div>
      )}

      {/* Sticky action bar — always visible; tapping prompts admin login if needed.
          Safe-area padding keeps it clear of the iOS home indicator / browser chrome. */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="net-line h-0.5 text-ink/15" />
        <div
          className="bg-paper/90 px-4 pt-3 backdrop-blur"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-2xl gap-2">
            {/* Adding players & logging games is open — no admin password. */}
            <Button variant="ghost" className="flex-1" onClick={() => setPlayerModal(true)}>
              + Add player
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => setMatchModal(true)}
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
