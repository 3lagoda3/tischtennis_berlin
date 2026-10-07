"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PingBall, Button } from "../ui";
import { ThemeToggle } from "../ThemeToggle";
import { Grid, FleetStrip } from "./Grid";
import { Placement } from "./Placement";
import {
  SIZE, MISS, HIT, CLEARED, createGame, setFleet, fire, rematch, isSunk, label, shotsFired,
} from "../../lib/battleship/engine";
import { chooseShot } from "../../lib/battleship/ai";
import { createRoom } from "../../lib/battleship/online";
import { isConfigured } from "../../lib/supabaseClient";

const SAVE_KEY = "berlin-battleship-v1";
const LEVELS = [
  ["easy", "Easy"],
  ["normal", "Normal"],
  ["hard", "Hard"],
];

function readSave() {
  try {
    const g = JSON.parse(localStorage.getItem(SAVE_KEY));
    return g && g.players && g.phase !== "over" ? g : null;
  } catch {
    return null;
  }
}

export function Header({ back = "/", backLabel = "← Berlin Pong" }) {
  return (
    <header className="mb-6 flex items-center gap-3">
      <Link href={back} aria-label="Back" className="flex items-center gap-3">
        <PingBall className="h-9 w-9" />
      </Link>
      <div>
        <h1 className="text-2xl font-black leading-none tracking-tight">Berlin Battleship</h1>
        <Link href={back} className="text-sm font-medium text-ink/50 hover:text-ink">
          {backLabel}
        </Link>
      </div>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}

function InviteCard({ code }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/battleship/${code}` : "";
  async function share() {
    try {
      if (navigator.share) return await navigator.share({ title: "Морской бой?", url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <div className="rounded-3xl bg-paper p-5 ring-1 ring-ball">
      <p className="text-sm font-semibold text-ink/60">Send this link to your friend</p>
      <p className="my-1 break-all text-base font-black tracking-tight">{url.replace(/^https?:\/\//, "")}</p>
      <p className="mb-3 text-sm text-ink/50">
        Or tell them the code: <b className="tracking-widest text-ink">{code}</b>
      </p>
      <Button variant="accent" onClick={share}>
        {copied ? "Copied ✓" : "Copy invite link"}
      </Button>
    </div>
  );
}

function Lobby({ onComputer, onOnline, onJoin, canResume, onResume }) {
  const [level, setLevel] = useState("normal");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const input =
    "w-full rounded-full bg-paper px-4 py-2 text-sm font-semibold outline-none ring-1 ring-ink/10 focus:ring-ball";

  return (
    <div className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <PingBall className="h-6 w-6 shrink-0" />
        <div>
          <h2 className="text-lg font-black tracking-tight">Морской бой</h2>
          <p className="text-sm text-ink/50">Hide your fleet, hunt theirs. Play the computer or a friend online.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-ink/[0.04] p-4">
        <p className="mb-3 text-sm font-bold">Play the computer</p>
        <div className="mb-3 flex rounded-full bg-paper p-0.5 text-xs font-semibold ring-1 ring-ink/10">
          {LEVELS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setLevel(v)}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${level === v ? "bg-ink text-paper" : "text-ink/50"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="accent" className="flex-1" onClick={() => onComputer(level)}>
            Start game
          </Button>
          {canResume && (
            <Button variant="ghost" className="flex-1" onClick={onResume}>
              Resume last game
            </Button>
          )}
        </div>
      </div>

      {onOnline && (
        <div className="mt-4 rounded-2xl bg-ink/[0.04] p-4">
          <p className="text-sm font-bold">Play a friend online</p>
          <p className="mb-3 text-sm text-ink/50">You get a link to send. No sign-up for either of you.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={14}
            placeholder="Your name"
            aria-label="Your name for the online game"
            className={`${input} mb-2`}
          />
          <Button variant="primary" className="w-full" onClick={() => onOnline(name)}>
            Create online game
          </Button>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim().length === 4) onJoin(code.trim().toUpperCase());
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="Got a code?"
              aria-label="Game code"
              className={`${input} tracking-widest`}
            />
            <Button variant="ghost" type="submit" disabled={code.trim().length !== 4}>
              Join
            </Button>
          </form>
        </div>
      )}

      <details className="mt-6 text-sm text-ink/60">
        <summary className="cursor-pointer font-semibold text-ink/70">How it works</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>10×10 sea, ten ships each: one 4, two 3s, three 2s, four 1s.</li>
          <li>Ships run straight and can’t touch each other, not even at the corners.</li>
          <li>Take turns firing at a square. Hit or sink something and you go again; a miss passes the turn.</li>
          <li>Water around a sunk ship is marked for you automatically.</li>
          <li>Sink the whole enemy fleet first to win.</li>
        </ul>
      </details>
    </div>
  );
}

export function BattleshipApp({ online = null }) {
  const router = useRouter();
  const [localGame, setLocalGame] = useState(null);
  const [saved, setSaved] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const game = online ? online.game : localGame;
  // `update` takes a pure (state) => nextState | null so online writes can be retried on conflict.
  const update = online ? online.commit : (fn) => setLocalGame((g) => (g && fn(g)) || g);

  const me = online ? online.seat : 0;
  const opp = 1 - me;

  useEffect(() => setSaved(readSave()), []);

  useEffect(() => {
    if (!game || online) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch {}
  }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  // Announce sinkings and the end of the game.
  const lastKey = game ? `${game.moves}:${game.phase}` : "";
  const seenKey = useRef(lastKey);
  useEffect(() => {
    if (!game || lastKey === seenKey.current) return;
    seenKey.current = lastKey;
    const l = game.last;
    if (game.phase === "over") setToast(game.winner === me ? "You won! 🎉" : `${game.players[game.winner].name} won`);
    else if (l?.result === "sunk") setToast(l.by === me ? `Sunk their ${l.len}! 💥` : `They sunk your ${l.len}`);
    if (l?.by !== me && l?.result !== "miss" && typeof navigator !== "undefined") navigator.vibrate?.(60);
  }, [lastKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computer gunner ──
  const shooter = game?.phase === "battle" ? game.players[game.turn] : null;
  useEffect(() => {
    if (online || !shooter?.ai) return;
    const t = setTimeout(() => {
      update((g) => {
        if (g.phase !== "battle" || !g.players[g.turn].ai) return null;
        const target = g.players[1 - g.turn];
        return fire(g, g.turn, chooseShot(target.shots, target.ships, g.players[g.turn].ai));
      });
    }, 750);
    return () => clearTimeout(t);
  }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──
  function startComputer(level) {
    setLocalGame(createGame([{ name: "You" }, { name: "Computer", ai: level }], 0));
    setSaved(null);
  }

  async function startOnline(name) {
    try {
      const code = await createRoom(name.trim() || "Player 1");
      router.push(`/battleship/${code}`);
    } catch {
      setToast("Couldn’t open a room. Try again.");
    }
  }

  async function ready(ships) {
    setBusy(true);
    await update((g) => (g.players[me].ready ? null : setFleet(g, me, ships)));
    setBusy(false);
  }

  function shoot(i) {
    update((g) => fire(g, me, i));
  }

  function leave() {
    if (online) return router.push("/battleship");
    setLocalGame(null);
    setSaved(null);
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
  }

  // ── Boards ──
  const boards = useMemo(() => {
    if (!game || game.phase === "placing") return null;
    const view = (seat, showShips) => {
      const p = game.players[seat];
      const sunk = new Set();
      const ship = new Set();
      for (const s of p.ships) {
        s.cells.forEach((x) => ship.add(x));
        if (isSunk(s, p.shots)) s.cells.forEach((x) => sunk.add(x));
      }
      const lastHere = game.last && game.last.by !== seat ? game.last.i : -1;
      return Array.from({ length: SIZE * SIZE }, (_, i) => {
        const s = p.shots[i];
        let kind = "water";
        if (s === MISS) kind = "miss";
        else if (s === CLEARED) kind = "cleared";
        else if (s === HIT) kind = sunk.has(i) ? "sunk" : "hit";
        else if (ship.has(i)) kind = showShips === true ? "ship" : showShips === "ghost" ? "ghost" : "water";
        return { kind, last: i === lastHere };
      });
    };
    return {
      enemy: view(opp, game.phase === "over" ? "ghost" : false),
      mine: view(me, true),
    };
  }, [game, me, opp]);

  const myTurn = game?.phase === "battle" && game.turn === me && !game.waiting;
  const status = (() => {
    if (!game || game.phase !== "battle") return "";
    const l = game.last;
    const who = (seat) => (seat === me ? "You" : game.players[seat].name);
    const what = l ? `${who(l.by)} fired at ${label(l.i)}: ${l.result === "miss" ? "miss." : l.result === "hit" ? "hit!" : "sunk!"}` : "";
    if (myTurn) return l ? `${what} ${l.by === me ? "Fire again." : "Your turn."}` : "You shoot first. Pick a square.";
    const name = game.players[game.turn].name;
    return l ? `${what} ${name} is aiming…` : `${name} shoots first…`;
  })();

  // ── Render ──
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <Header />

      {!game ? (
        <Lobby
          onComputer={startComputer}
          onOnline={isConfigured ? startOnline : null}
          onJoin={(code) => router.push(`/battleship/${code}`)}
          canResume={!!saved}
          onResume={() => setLocalGame(saved)}
        />
      ) : (
        <div className="space-y-4">
          {online && game.waiting && <InviteCard code={online.code} />}

          {game.phase === "placing" &&
            (game.players[me].ready ? (
              <div className="rounded-3xl bg-paper p-6 text-center ring-1 ring-ink/10">
                <p className="font-semibold">Fleet locked in ✓</p>
                <p className="text-sm text-ink/50">
                  {game.waiting
                    ? "Waiting for your friend to join…"
                    : `Waiting for ${game.players[opp].name} to place their ships…`}
                </p>
              </div>
            ) : (
              <Placement key={game.moves + ":" + game.first} initial={game.players[me].ships} onReady={ready} busy={busy} />
            ))}

          {boards && (
            <>
              {/* Scoreboard */}
              <div className="flex gap-2">
                {[me, opp].map((seat) => {
                  const p = game.players[seat];
                  const afloat = game.players[seat].ships.filter((s) => !isSunk(s, p.shots)).length;
                  const active = game.phase === "battle" && game.turn === seat;
                  const won = game.phase === "over" && game.winner === seat;
                  return (
                    <div
                      key={seat}
                      className={`flex-1 rounded-2xl px-3 py-2 transition ${
                        active ? "bg-ink text-paper" : won ? "bg-ball text-white" : "bg-paper ring-1 ring-ink/10"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate text-xs font-semibold opacity-70">
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-ball" />}
                        <span className="truncate">{seat === me && !online ? "You" : p.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="tabnum text-2xl font-black leading-tight">{afloat}</span>
                        <span className="text-xs font-semibold opacity-60">ships afloat</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {game.phase === "over" ? (
                <div className="rounded-3xl bg-paper p-5 text-center ring-1 ring-ball">
                  <p className="text-2xl font-black tracking-tight">
                    {game.winner === me ? "Victory 🎉" : `${game.players[game.winner].name} wins`}
                  </p>
                  <p className="mb-4 text-sm text-ink/50">
                    {game.winner === me ? "You" : game.players[game.winner].name} needed{" "}
                    {shotsFired(game, game.winner)} shots.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="accent" className="flex-1" onClick={() => update((g) => (g.phase === "over" ? rematch(g) : null))}>
                      Rematch
                    </Button>
                    <Button variant="ghost" className="flex-1" onClick={leave}>
                      {online ? "Back to lobby" : "New game"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`min-h-[2.5rem] text-center text-sm font-semibold ${myTurn ? "text-ink" : "text-ink/50"}`}>
                  {status}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <section className={`transition ${myTurn ? "" : "opacity-90"}`}>
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-ink/50">Enemy waters</h2>
                    {myTurn && <span className="text-xs font-bold text-ball">Your shot</span>}
                  </div>
                  <div className={`rounded-[1.1rem] ${myTurn ? "ring-2 ring-ball" : ""}`}>
                    <Grid
                      cells={boards.enemy}
                      onCell={shoot}
                      canTap={(i) => myTurn && game.players[opp].shots[i] === 0}
                    />
                  </div>
                  <div className="mt-2">
                    <FleetStrip ships={game.players[opp].ships} shots={game.players[opp].shots} />
                  </div>
                </section>
                <section className="mx-auto w-3/4 sm:w-full">
                  <h2 className="mb-1.5 px-1 text-sm font-bold uppercase tracking-widest text-ink/50">Your fleet</h2>
                  <Grid cells={boards.mine} />
                  <div className="mt-2">
                    <FleetStrip ships={game.players[me].ships} shots={game.players[me].shots} />
                  </div>
                </section>
              </div>
            </>
          )}

          {game.phase !== "over" && (
            <div className="text-center">
              <button onClick={leave} className="text-sm font-semibold text-ink/40 transition hover:text-ink">
                {online ? "Leave game" : "End game"}
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-[70] flex justify-center">
          <span className="animate-bounce-in rounded-full bg-ball px-5 py-2 text-sm font-black text-white shadow-lg">
            {toast}
          </span>
        </div>
      )}
    </main>
  );
}
