"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isConfigured } from "../lib/supabaseClient";
import { buildStandings } from "../lib/standings";
import { PingBall, Button } from "../components/ui";
import { Leaderboard } from "../components/Leaderboard";
import { HeadToHead } from "../components/HeadToHead";
import { AddPlayerModal } from "../components/AddPlayerModal";
import { AddMatchModal } from "../components/AddMatchModal";
import { SetupNotice } from "../components/SetupNotice";

export default function Page() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured) return;
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("players").select("*"),
      supabase.from("matches").select("*").order("created_at", { ascending: false }),
    ]);
    setPlayers(p || []);
    setMatches(m || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    load();

    // Live updates: refetch whenever anyone changes players or matches.
    const channel = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  const standings = useMemo(() => buildStandings(players, matches), [players, matches]);

  if (!isConfigured) return <SetupNotice />;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-8 sm:pt-12">
      {/* Header */}
      <header className="mb-8 flex items-center gap-3">
        <PingBall className="h-9 w-9" />
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight">Berlin Pong</h1>
          <p className="text-sm font-medium text-ink/50">Summer Championship ’26</p>
        </div>
        <div className="ml-auto rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold tabnum text-ink/60">
          {players.length} players · {matches.length} games
        </div>
      </header>

      {loading ? (
        <p className="py-16 text-center text-ink/40">Loading the table…</p>
      ) : (
        <div className="space-y-6">
          <Leaderboard rows={standings} />
          <HeadToHead players={players} matches={matches} />
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="net-line h-0.5 text-ink/15" />
        <div className="bg-paper/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowPlayer(true)}>
              + Add player
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => setShowMatch(true)}
              disabled={players.length < 2}
            >
              + Log a game
            </Button>
          </div>
        </div>
      </div>

      <AddPlayerModal open={showPlayer} onClose={() => setShowPlayer(false)} onAdded={load} />
      <AddMatchModal
        open={showMatch}
        onClose={() => setShowMatch(false)}
        players={players}
        onAdded={load}
      />
    </main>
  );
}
