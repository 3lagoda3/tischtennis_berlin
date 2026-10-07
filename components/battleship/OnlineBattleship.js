"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "../ui";
import { BattleshipApp, Header } from "./BattleshipApp";
import { isConfigured } from "../../lib/supabaseClient";
import { myToken, fetchRoom, saveRoom, subscribeRoom } from "../../lib/battleship/online";

function Shell({ children }) {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <Header back="/battleship" backLabel="← Lobby" />
      {children}
    </main>
  );
}

export function OnlineBattleship() {
  const code = String(useParams().code || "").toUpperCase();
  const [room, setRoom] = useState(null); // { state, version }
  const [phase, setPhase] = useState("loading"); // loading | missing | error | ready
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const versionRef = useRef(-1);
  const roomRef = useRef(null);
  const token = useRef(null);

  const apply = useCallback((row) => {
    if (row.version <= versionRef.current) return;
    versionRef.current = row.version;
    roomRef.current = row;
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

  // Apply `fn` to the latest state and write it. If someone else wrote first,
  // pull their version and re-run `fn` on top of it (it returns null when the move no longer applies).
  const commit = useCallback(
    async (fn) => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const base = roomRef.current;
        if (!base) return;
        const next = fn(base.state);
        if (!next) return;
        apply({ state: next, version: base.version + 1 }); // optimistic
        try {
          if ((await saveRoom(code, next, base.version)) != null) return;
        } catch {}
        versionRef.current = -1;
        const fresh = await fetchRoom(code).catch(() => null);
        if (!fresh) return;
        apply(fresh);
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
          <Link href="/battleship">
            <Button variant="accent">Back to the lobby</Button>
          </Link>
        </div>
      </Shell>
    );

  const game = room.state;
  const seat = game.players.findIndex((p) => p.token && p.token === token.current);

  // Not seated yet: take the open seat, or turn away.
  if (seat < 0) {
    return (
      <Shell>
        <div className="rounded-3xl bg-paper p-6 ring-1 ring-ink/10">
          {game.waiting ? (
            <>
              <h2 className="mb-1 text-lg font-black tracking-tight">{game.players[0].name} challenged you</h2>
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
                  await commit((s) =>
                    s.waiting
                      ? {
                          ...s,
                          waiting: false,
                          players: s.players.map((p, i) =>
                            i === 1 ? { ...p, name: name.trim() || "Player 2", token: token.current } : p
                          ),
                        }
                      : null
                  );
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
              <Link href="/battleship">
                <Button variant="accent">Back to the lobby</Button>
              </Link>
            </>
          )}
        </div>
      </Shell>
    );
  }

  return <BattleshipApp online={{ code, seat, game, commit }} />;
}
