"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PingBall, Button } from "../ui";
import { ThemeToggle } from "../ThemeToggle";
import { ScrabbleApp } from "./ScrabbleApp";
import { isConfigured } from "../../lib/supabaseClient";
import { myToken, fetchRoom, saveRoom, subscribeRoom } from "../../lib/scrabble/online";

function Shell({ children }) {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/scrabble" aria-label="Scrabble home">
          <PingBall className="h-9 w-9" />
        </Link>
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight">Berlin Scrabble</h1>
          <Link href="/scrabble" className="text-sm font-medium text-ink/50 hover:text-ink">
            ← Lobby
          </Link>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      {children}
    </main>
  );
}

export function OnlineScrabble() {
  const code = String(useParams().code || "").toUpperCase();
  const [room, setRoom] = useState(null); // { state, version }
  const [phase, setPhase] = useState("loading"); // loading | missing | error | ready
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const versionRef = useRef(-1);
  const token = useRef(null);

  const apply = useCallback((row) => {
    if (row.version <= versionRef.current) return;
    versionRef.current = row.version;
    setRoom(row);
  }, []);

  useEffect(() => {
    if (!isConfigured) return setPhase("error");
    token.current = myToken();
    let stop = () => {};
    let timer;
    fetchRoom(code)
      .then((row) => {
        if (!row) return setPhase("missing");
        apply(row);
        setPhase("ready");
        stop = subscribeRoom(code, apply);
        // Safety net in case a realtime message is missed.
        timer = setInterval(() => fetchRoom(code).then((r) => r && apply(r)).catch(() => {}), 4000);
      })
      .catch(() => setPhase("error"));
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [code, apply]);

  // Write a new state; on conflict, pull the latest and let the player retry.
  const commit = useCallback(
    async (next) => {
      const v = versionRef.current;
      apply({ state: next, version: v + 1 }); // optimistic
      try {
        const saved = await saveRoom(code, next, v);
        if (saved == null) {
          versionRef.current = -1;
          const fresh = await fetchRoom(code);
          if (fresh) apply(fresh);
        }
      } catch {
        versionRef.current = -1;
        const fresh = await fetchRoom(code).catch(() => null);
        if (fresh) apply(fresh);
      }
    },
    [code, apply]
  );

  if (phase === "loading")
    return (
      <Shell>
        <p className="py-16 text-center text-ink/40">Opening the room…</p>
      </Shell>
    );
  if (phase === "missing" || phase === "error")
    return (
      <Shell>
        <div className="rounded-3xl bg-paper p-6 text-center ring-1 ring-ink/10">
          <p className="mb-4 font-semibold">
            {phase === "missing" ? `No game found for code ${code}.` : "Couldn’t reach the game server."}
          </p>
          <Link href="/scrabble">
            <Button variant="accent">Back to the lobby</Button>
          </Link>
        </div>
      </Shell>
    );

  const game = room.state;
  const seat = game.players.findIndex((p) => p.token && p.token === token.current);

  // Not seated yet: join the open seat, or turn away.
  if (seat < 0) {
    const open = game.waiting;
    return (
      <Shell>
        <div className="rounded-3xl bg-paper p-6 ring-1 ring-ink/10">
          {open ? (
            <>
              <h2 className="mb-1 text-lg font-black tracking-tight">{game.players[0].name} invited you</h2>
              <p className="mb-4 text-sm text-ink/50">Pick a name and you’re in. No sign-up.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={14}
                placeholder="Your name"
                aria-label="Your name"
                className="mb-3 w-full rounded-full bg-ink/5 px-4 py-2.5 text-sm font-semibold outline-none ring-1 ring-ink/10 focus:ring-ball"
              />
              <Button
                variant="accent"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const next = {
                    ...game,
                    waiting: false,
                    players: game.players.map((p, i) =>
                      i === 1 ? { ...p, name: name.trim() || "Player 2", token: token.current } : p
                    ),
                  };
                  await commit(next);
                  setBusy(false);
                }}
              >
                Join game
              </Button>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-black tracking-tight">This game is full</h2>
              <p className="mb-4 text-sm text-ink/50">
                {game.players[0].name} and {game.players[1].name} are already playing. Start your own?
              </p>
              <Link href="/scrabble">
                <Button variant="accent">Back to the lobby</Button>
              </Link>
            </>
          )}
        </div>
      </Shell>
    );
  }

  return <ScrabbleApp online={{ code, seat, game, commit }} />;
}
