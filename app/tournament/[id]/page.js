"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { computeElo } from "../../../lib/elo";
import {
  formatName,
  fixtureStandings,
  playableFixtures,
  applyResult,
  badgeFor,
} from "../../../lib/tournament";
import { useApp } from "../../../components/AppProvider";
import { Avatar, Button, PingBall } from "../../../components/ui";
import { FixtureResultModal } from "../../../components/FixtureResultModal";

function Fixture({ f, byId, onLog, canLog }) {
  const p1 = byId[f.p1];
  const p2 = byId[f.p2];
  const done = f.status === "done";
  const bye = done && (f.p1 == null || f.p2 == null);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-ink/[0.03] px-3 py-2 text-sm">
      <span className={`min-w-0 flex-1 truncate text-right font-medium ${done && f.winnerId === f.p1 ? "text-ball" : ""}`}>
        {p1?.nickname || (f.p1 ? "?" : "—")}
      </span>
      <span className="shrink-0 tabnum font-bold text-ink/40">
        {bye ? "bye" : done ? `${f.score1}:${f.score2}` : f.p1 && f.p2 ? "vs" : "…"}
      </span>
      <span className={`min-w-0 flex-1 truncate font-medium ${done && f.winnerId === f.p2 ? "text-ball" : ""}`}>
        {p2?.nickname || (f.p2 ? "?" : "—")}
      </span>
      {canLog && !done && f.p1 && f.p2 && (
        <button
          onClick={() => onLog(f)}
          className="shrink-0 rounded-full bg-ball px-3 py-1 text-xs font-semibold text-white hover:bg-ball/90"
        >
          Log
        </button>
      )}
    </div>
  );
}

export default function TournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, players, matches, loading, load, unlocked, ensure } = useApp();
  const [logging, setLogging] = useState(null);

  const t = tournaments.find((x) => x.id === id);
  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const data = t?.data;
  const playable = useMemo(() => (data ? playableFixtures(data) : []), [data]);
  const standings = useMemo(
    () => (data ? fixtureStandings(data.fixtures, data.playerIds) : []),
    [data]
  );

  // Group fixtures by their label for display (rounds / groups / bracket).
  const groups = useMemo(() => {
    if (!data) return [];
    const m = new Map();
    for (const f of data.fixtures) {
      const key = f.label || `Round ${f.round + 1}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(f);
    }
    return [...m.entries()];
  }, [data]);

  if (loading) return <p className="py-24 text-center text-ink/40">Loading…</p>;

  if (!t) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink/50">Tournament not found.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-ball">← Back to the table</Link>
      </main>
    );
  }

  async function logFixture(s1, s2) {
    const f = logging;
    const winnerId = s1 > s2 ? f.p1 : f.p2;
    // 1) record as a real game so it counts toward Elo
    const { data: mrow, error: mErr } = await supabase
      .from("matches")
      .insert({
        player1_id: f.p1,
        player2_id: f.p2,
        score1: s1,
        score2: s2,
        winner_id: winnerId,
        tournament_id: t.id,
      })
      .select()
      .single();
    if (mErr) throw mErr;

    // 2) advance the bracket on a copy of the tournament data
    const { rating } = computeElo(players, matches);
    const next = JSON.parse(JSON.stringify(t.data));
    applyResult(next, f.id, s1, s2, rating);
    const updated = next.fixtures.find((x) => x.id === f.id);
    if (updated) updated.matchId = mrow.id;

    // 3) persist
    const { error: tErr } = await supabase
      .from("tournaments")
      .update({ data: next, status: next.status, winner_id: next.winnerId || null })
      .eq("id", t.id);
    if (tErr) throw tErr;
    load();
  }

  async function deleteTournament() {
    if (!confirm(`Delete "${t.name}"? Games already played stay in the history.`)) return;
    await supabase.from("tournaments").delete().eq("id", t.id);
    load();
    router.push("/");
  }

  const champ = t.winner_id ? byId[t.winner_id] : null;
  const showStandings = t.format === "round_robin" || t.format === "swiss" || t.format === "duel";

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink/50 hover:text-ink">
          <PingBall className="h-4 w-4" /> Back to table
        </Link>
        {unlocked && (
          <Button variant="danger" onClick={() => ensure(deleteTournament)}>Delete</Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black tracking-tight">{t.name}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            t.status === "completed" ? "bg-ink/10 text-ink/50" : "bg-ball/15 text-ball"
          }`}
        >
          {t.status === "completed" ? "Finished" : "Live"}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/50">{formatName(t.format)}</p>

      {champ && (
        <div className="mt-5 flex items-center gap-3 rounded-3xl bg-ball/10 p-4 ring-1 ring-ball/20">
          <span className="text-3xl">{badgeFor(t.format).icon}</span>
          <Avatar src={champ.photo_url} name={champ.nickname} size={44} />
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: badgeFor(t.format).color }}
            >
              {badgeFor(t.format).label}
            </div>
            <div className="text-lg font-black">{champ.nickname}</div>
          </div>
        </div>
      )}

      {/* Up next */}
      {t.status !== "completed" && playable.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-ink/50">Up next</h2>
          <div className="space-y-1.5">
            {playable.map((f) => (
              <Fixture
                key={f.id}
                f={f}
                byId={byId}
                canLog={unlocked}
                onLog={(fx) => ensure(() => setLogging(fx))}
              />
            ))}
          </div>
          {!unlocked && (
            <p className="mt-2 text-xs text-ink/40">Log in as admin to record results.</p>
          )}
        </section>
      )}

      {/* Standings (round-robin / swiss) */}
      {showStandings && standings.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-ink/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-ink/40">
                <th className="py-3 pl-5 pr-2 font-semibold">#</th>
                <th className="py-3 px-2 font-semibold">Player</th>
                <th className="py-3 px-2 text-center font-semibold">W</th>
                <th className="py-3 px-2 text-center font-semibold">L</th>
                <th className="py-3 pl-2 pr-5 text-right font-semibold">Diff</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((r, i) => (
                <tr key={r.id} className="border-t border-ink/5">
                  <td className="py-2.5 pl-5 pr-2 tabnum font-bold text-ink/40">{i + 1}</td>
                  <td className="py-2.5 px-2">
                    <Link href={`/player/${r.id}`} className="flex items-center gap-2 hover:text-ball">
                      <Avatar src={byId[r.id]?.photo_url} name={byId[r.id]?.nickname} size={26} />
                      <span className="font-semibold">{byId[r.id]?.nickname}</span>
                    </Link>
                  </td>
                  <td className="py-2.5 px-2 text-center tabnum font-semibold">{r.won}</td>
                  <td className="py-2.5 px-2 text-center tabnum text-ink/60">{r.lost}</td>
                  <td className="py-2.5 pl-2 pr-5 text-right tabnum text-ink/60">
                    {r.diff > 0 ? `+${r.diff}` : r.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Full schedule / bracket */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-ink/50">Schedule</h2>
        <div className="space-y-4">
          {groups.map(([label, fxs]) => (
            <div key={label}>
              <div className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-ink/40">
                {label}
              </div>
              <div className="space-y-1.5">
                {fxs.map((f) => (
                  <Fixture
                    key={f.id}
                    f={f}
                    byId={byId}
                    canLog={unlocked}
                    onLog={(fx) => ensure(() => setLogging(fx))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FixtureResultModal
        open={Boolean(logging)}
        fixture={logging}
        p1={byId[logging?.p1]}
        p2={byId[logging?.p2]}
        onClose={() => setLogging(null)}
        onSubmit={logFixture}
      />
    </main>
  );
}
