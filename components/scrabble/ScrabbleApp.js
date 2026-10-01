"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PingBall, Button, Modal } from "../ui";
import { ThemeToggle } from "../ThemeToggle";
import { Board } from "./Board";
import { Tile } from "./Tile";
import { Setup } from "./Setup";
import {
  createGame, evaluateMove, applyPlay, applyPass, applySwap, reorderRack,
  isFirstMove, shuffle, RACK_SIZE,
} from "../../lib/scrabble/engine";
import { generateMoves, chooseMove } from "../../lib/scrabble/ai";
import { loadDictionary, getTrie } from "../../lib/scrabble/dictionary";
import { createRoom } from "../../lib/scrabble/online";
import { isConfigured } from "../../lib/supabaseClient";

const SAVE_KEY = "berlin-scrabble-v1";

function readSave() {
  try {
    const g = JSON.parse(localStorage.getItem(SAVE_KEY));
    return g && g.players && !g.over ? g : null;
  } catch {
    return null;
  }
}

function InviteCard({ code }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/scrabble/${code}` : "";
  async function share() {
    try {
      if (navigator.share) return await navigator.share({ title: "Scrabble?", url });
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

export function ScrabbleApp({ online = null }) {
  const router = useRouter();
  const [dict, setDict] = useState(null);
  const [dictError, setDictError] = useState(false);
  const [localGame, setLocalGame] = useState(null);
  const game = online ? online.game : localGame;
  const setGame = online ? online.commit : setLocalGame;
  const [saved, setSaved] = useState(null);

  const [pending, setPending] = useState([]); // [{ r, c, ri, l, blank }]
  const [selected, setSelected] = useState(null); // rack index
  const [drag, setDrag] = useState(null); // { l, blank, x, y }
  const [blankAsk, setBlankAsk] = useState(null); // { ri, r, c }
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapPick, setSwapPick] = useState([]);
  const [confirmNew, setConfirmNew] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [toast, setToast] = useState(null);
  const ignoreClick = useRef(0);

  useEffect(() => {
    setSaved(readSave());
    loadDictionary().then(setDict).catch(() => setDictError(true));
  }, []);

  useEffect(() => {
    if (!game || online) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch {}
  }, [game]);

  // New turn → clear any half-built move.
  const turnKey = game ? `${game.history.length}:${game.turn}` : "";
  useEffect(() => {
    setPending([]);
    setSelected(null);
    setRevealed(false);
  }, [turnKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const cp = game ? game.players[game.turn] : null;
  const me = game ? (online ? online.seat : game.turn) : 0;
  const mine = game ? game.players[me] : null;
  const myTurn = !!game && !game.over && !game.waiting && (!online || game.turn === me);
  const humans = game ? game.players.filter((p) => !p.ai).length : 0;
  const hidden = !online && !!game && !game.over && !cp.ai && humans > 1 && !revealed;

  // ── Computer player ──
  useEffect(() => {
    if (!game || game.over || !dict || !cp.ai) return;
    setThinking(true);
    const t = setTimeout(() => {
      const root = getTrie(dict);
      const moves = generateMoves(game.board, cp.rack, root);
      const m = chooseMove(moves, cp.rack, cp.ai);
      let next;
      if (m) {
        next = applyPlay(game, m.placements, m.evaluation);
        if (m.evaluation.bingo) setToast(`${cp.name}: BINGO +${m.evaluation.score}`);
      } else if (game.bag.length >= RACK_SIZE) {
        next = applySwap(game, cp.rack.filter((x) => x !== "?").slice(0, 4)) || applyPass(game);
      } else {
        next = applyPass(game);
      }
      setThinking(false);
      setGame(next);
    }, 900);
    return () => {
      clearTimeout(t);
      setThinking(false);
    };
  }, [game, dict]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live evaluation of the half-built move ──
  const evaluation = useMemo(() => {
    if (!game || !pending.length) return null;
    const placements = pending.map((p) => ({ r: p.r, c: p.c, l: p.l, b: p.blank }));
    const ev = evaluateMove(game.board, placements, isFirstMove(game));
    if (!ev.ok) return ev;
    const bad = dict ? ev.words.filter((w) => !dict.has(w.word)).map((w) => w.word) : [];
    return { ...ev, bad };
  }, [game, pending, dict]);

  const canPlay = !!evaluation?.ok && !evaluation.bad.length && !!dict && !cp?.ai && !hidden && myTurn;
  const usedRi = new Set(pending.map((p) => p.ri));

  // ── Placing tiles ──
  const place = useCallback(
    (ri, r, c, keepLetter) => {
      const tile = mine.rack[ri];
      setPending((ps) => ps.filter((p) => p.ri !== ri));
      if (tile === "?" && !keepLetter) {
        setBlankAsk({ ri, r, c });
        return;
      }
      setPending((ps) => [
        ...ps.filter((p) => p.ri !== ri),
        { r, c, ri, l: tile === "?" ? keepLetter : tile, blank: tile === "?" },
      ]);
      setSelected(null);
    },
    [mine]
  );

  const recallOne = (ri) => setPending((ps) => ps.filter((p) => p.ri !== ri));

  function onCell(r, c) {
    if (Date.now() < ignoreClick.current) return;
    if (selected != null && !hidden && !cp.ai && !game.waiting) place(selected, r, c);
  }

  // Unified tap / drag for rack tiles and pending board tiles.
  function startDrag(e, src) {
    if (hidden || cp.ai || game.waiting || (e.button != null && e.button !== 0)) return;
    const start = { x: e.clientX, y: e.clientY };
    const ghost = { l: src.l, blank: src.blank };
    let moved = false;

    const onMove = (ev) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) moved = true;
      if (moved) setDrag({ ...ghost, x: ev.clientX, y: ev.clientY });
    };
    const finish = (ev, cancelled) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      setDrag(null);
      if (src.fromBoard) ignoreClick.current = Date.now() + 120;
      if (cancelled) return;
      if (!moved) {
        if (src.fromBoard) recallOne(src.ri);
        else setSelected((s) => (s === src.ri ? null : src.ri));
        return;
      }
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cell = el?.closest?.("[data-cell]");
      if (cell) {
        const i = Number(cell.dataset.cell);
        const r = Math.floor(i / 15), c = i % 15;
        if (!game.board[i] && !pending.some((p) => p.r === r && p.c === c && p.ri !== src.ri)) {
          place(src.ri, r, c, src.fromBoard && src.blank ? src.l : undefined);
        }
      } else if (src.fromBoard) {
        recallOne(src.ri); // dragged off the board → back to the rack
      }
    };
    const onUp = (ev) => finish(ev, false);
    const onCancel = (ev) => finish(ev, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  // ── Actions ──
  function startGame(players) {
    setGame(createGame(players));
    setPending([]);
    setSelected(null);
    setShowResult(true);
    setSaved(null);
  }

  async function startOnline(name) {
    try {
      const code = await createRoom(name.trim() || "Player 1");
      router.push(`/scrabble/${code}`);
    } catch {
      setToast("Couldn’t open a room. Try again.");
    }
  }

  function play() {
    if (!canPlay) return;
    const placements = pending.map((p) => ({ r: p.r, c: p.c, l: p.l, b: p.blank }));
    if (evaluation.bingo) setToast(`BINGO! +${evaluation.score}`);
    setGame(applyPlay(game, placements, evaluation));
  }

  function shuffleRack() {
    setPending([]);
    setSelected(null);
    setGame(reorderRack(game, shuffle(mine.rack), me));
  }

  function doSwap() {
    const next = applySwap(game, swapPick.map((i) => mine.rack[i]));
    setSwapOpen(false);
    setSwapPick([]);
    if (next) setGame(next);
  }

  function leave() {
    if (online) return router.push("/scrabble");
    setLocalGame(null);
    setSaved(null);
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    setConfirmNew(false);
  }

  // ── Render ──
  const last = new Set(game?.lastMove || []);
  const status = (() => {
    if (!game) return "";
    if (game.over) return "Game over.";
    if (game.waiting) return "Waiting for your friend to join…";
    if (online && !myTurn) return `${cp.name}’s turn…`;
    if (cp.ai) return `${cp.name} is thinking…`;
    if (hidden) return `Pass the device to ${cp.name}.`;
    if (!pending.length) return `${cp.name}: tap a tile, then a square — or drag it.`;
    if (!evaluation.ok) return evaluation.error;
    if (!dict) return "Loading dictionary…";
    if (evaluation.bad.length) return `Not a word: ${evaluation.bad.join(", ")}`;
    return evaluation.words.map((w) => `${w.word} ${w.score}`).join(" · ") + (evaluation.bingo ? " · +50 bingo" : "");
  })();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" aria-label="Back to Berlin Pong" className="flex items-center gap-3">
          <PingBall className="h-9 w-9" />
        </Link>
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight">Berlin Scrabble</h1>
          <Link href="/" className="text-sm font-medium text-ink/50 hover:text-ink">
            ← Berlin Pong
          </Link>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {dictError && (
        <p className="mb-4 rounded-2xl bg-ball/10 p-3 text-sm font-medium text-ball">
          Couldn’t load the dictionary. Check your connection and reload.
        </p>
      )}

      {!game ? (
        <Setup
          onStart={startGame}
          canResume={!!saved}
          onOnline={isConfigured ? startOnline : null}
          onResume={() => {
            setGame(saved);
            setShowResult(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {online && game.waiting && <InviteCard code={online.code} />}

          {/* Scoreboard */}
          <div className="flex gap-2 overflow-x-auto">
            {game.players.map((p, i) => (
              <div
                key={i}
                className={`min-w-[5.5rem] flex-1 rounded-2xl px-3 py-2 transition ${
                  i === game.turn && !game.over ? "bg-ink text-paper" : "bg-paper ring-1 ring-ink/10"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate text-xs font-semibold opacity-70">
                  {i === game.turn && !game.over && <span className="h-1.5 w-1.5 rounded-full bg-ball" />}
                  <span className="truncate">{p.name}</span>
                </div>
                <div className="tabnum text-2xl font-black leading-tight">{p.score}</div>
              </div>
            ))}
            <div className="flex min-w-[4rem] flex-col justify-center rounded-2xl px-3 py-2 text-center ring-1 ring-ink/10">
              <div className="text-xs font-semibold text-ink/50">Bag</div>
              <div className="tabnum text-lg font-black">{game.bag.length}</div>
            </div>
          </div>

          <Board
            board={game.board}
            pending={pending}
            last={last}
            canDrop={selected != null}
            onCell={onCell}
            onPendingDown={(e, p) => startDrag(e, { ...p, fromBoard: true })}
          />

          {/* Status / live score */}
          <p
            className={`min-h-[2.5rem] text-center text-sm font-semibold ${
              evaluation && (!evaluation.ok || evaluation.bad?.length) ? "text-ball" : "text-ink/70"
            }`}
          >
            {status}
          </p>

          {/* Rack */}
          <div className="relative">
            <div className="flex justify-center gap-1.5 rounded-2xl bg-ink/10 p-2 ring-1 ring-ink/10" data-rack>
              {Array.from({ length: RACK_SIZE }, (_, i) => {
                const t = mine.rack[i];
                const empty = t == null || usedRi.has(i);
                return (
                  <div key={i} className="aspect-square w-full max-w-[3.6rem] rounded-[18%] bg-ink/10">
                    {!empty && !hidden && (
                      <Tile
                        l={t}
                        ring={selected === i}
                        className={`h-full w-full cursor-grab ${selected === i ? "-translate-y-1" : ""} transition`}
                        style={{ touchAction: "none" }}
                        onPointerDown={(e) => startDrag(e, { ri: i, l: t === "?" ? "" : t, blank: t === "?" })}
                      />
                    )}
                    {!empty && hidden && <div className="h-full w-full rounded-[18%] bg-ink/30" />}
                  </div>
                );
              })}
            </div>
            {hidden && (
              <button
                onClick={() => setRevealed(true)}
                className="absolute inset-0 rounded-2xl bg-ink text-sm font-bold text-paper"
              >
                {cp.name}: tap to reveal your tiles
              </button>
            )}
          </div>

          {/* Controls */}
          {myTurn && !cp.ai && !hidden && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="accent"
                className="min-w-[8rem] flex-[2]"
                disabled={!canPlay}
                onClick={play}
              >
                {canPlay ? `Play +${evaluation.score}` : "Play"}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => (pending.length ? setPending([]) : shuffleRack())}>
                {pending.length ? "Recall" : "Shuffle"}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                disabled={game.bag.length < RACK_SIZE}
                onClick={() => {
                  setPending([]);
                  setSwapPick([]);
                  setSwapOpen(true);
                }}
                title={game.bag.length < RACK_SIZE ? "Fewer than 7 tiles left in the bag" : "Swap tiles"}
              >
                Swap
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setGame(applyPass(game))}>
                Pass
              </Button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-ink/50">
            {[
              ["bg-ball", "TW ×3 word"],
              ["bg-ball/30", "DW ×2 word"],
              ["bg-ink/70", "TL ×3 letter"],
              ["bg-ink/15", "DL ×2 letter"],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${c}`} />
                {l}
              </span>
            ))}
          </div>

          {/* Move log */}
          {game.history.length > 0 && (
            <ul className="space-y-1 rounded-2xl bg-paper p-4 text-sm ring-1 ring-ink/10">
              {[...game.history].reverse().slice(0, 8).map((h, k) => (
                <li key={k} className="flex justify-between gap-3">
                  <span className="truncate text-ink/70">
                    <b className="text-ink">{game.players[h.player].name}</b>{" "}
                    {h.type === "play"
                      ? `played ${h.words.join(", ")}${h.bingo ? " (bingo!)" : ""}`
                      : h.type === "swap"
                      ? `swapped ${h.count} tile${h.count > 1 ? "s" : ""}`
                      : "passed"}
                  </span>
                  <span className="tabnum font-bold">{h.type === "play" ? `+${h.score}` : ""}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="text-center">
            <button
              onClick={() => (game.over ? leave() : setConfirmNew(true))}
              className="text-sm font-semibold text-ink/40 transition hover:text-ink"
            >
              {game.over ? (online ? "Back to lobby" : "New game") : online ? "Leave game" : "End game"}
            </button>
          </div>
        </div>
      )}

      {/* Drag ghost */}
      {drag && (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-[70%]"
          style={{ left: drag.x, top: drag.y, width: 52, height: 52 }}
        >
          <Tile l={drag.l} blank={drag.blank} ring className="h-full w-full rotate-3 shadow-2xl" />
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-[70] flex justify-center">
          <span className="animate-bounce-in rounded-full bg-ball px-5 py-2 text-sm font-black text-white shadow-lg">
            {toast}
          </span>
        </div>
      )}

      {/* Blank letter picker */}
      <Modal open={!!blankAsk} onClose={() => setBlankAsk(null)} title="Blank tile — pick a letter">
        <div className="grid grid-cols-6 gap-2">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((L) => (
            <button
              key={L}
              onClick={() => {
                place(blankAsk.ri, blankAsk.r, blankAsk.c, L);
                setBlankAsk(null);
              }}
              className="aspect-square rounded-xl bg-ink/5 text-lg font-black transition hover:bg-ball hover:text-white"
            >
              {L}
            </button>
          ))}
        </div>
      </Modal>

      {/* Swap */}
      <Modal open={swapOpen} onClose={() => setSwapOpen(false)} title="Swap tiles">
        <p className="mb-4 text-sm text-ink/60">Pick the tiles to throw back. You’ll skip this turn.</p>
        <div className="mb-5 flex justify-center gap-1.5">
          {mine?.rack.map((t, i) => (
            <button
              key={i}
              onClick={() => setSwapPick((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
              className="aspect-square w-full max-w-[3rem]"
            >
              <Tile l={t} blank={t === "?"} ring={swapPick.includes(i)} className={`h-full w-full ${swapPick.includes(i) ? "-translate-y-1" : "opacity-80"}`} />
            </button>
          ))}
        </div>
        <Button variant="accent" className="w-full" disabled={!swapPick.length} onClick={doSwap}>
          Swap {swapPick.length || ""} tile{swapPick.length === 1 ? "" : "s"}
        </Button>
      </Modal>

      {/* End game confirm */}
      <Modal open={confirmNew} onClose={() => setConfirmNew(false)} title={online ? "Leave this game?" : "End this game?"}>
        <p className="mb-5 text-sm text-ink/60">
          {online ? "You can come back with the same link, on this device." : "The current game will be lost."}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmNew(false)}>
            Keep playing
          </Button>
          <Button variant="primary" className="flex-1" onClick={leave}>
            {online ? "Leave" : "End game"}
          </Button>
        </div>
      </Modal>

      {/* Result */}
      <Modal open={!!game?.over && showResult} onClose={() => setShowResult(false)} title="Game over">
        {game?.over && (
          <>
            <p className="mb-1 text-2xl font-black tracking-tight">
              {game.result.winners.length > 1
                ? "It’s a tie!"
                : `${game.players[game.result.winners[0]].name} wins!`}
            </p>
            <p className="mb-5 text-sm text-ink/50">Leftover tiles have been scored.</p>
            <ol className="mb-6 space-y-2">
              {game.players
                .map((p, i) => ({ ...p, i }))
                .sort((a, b) => b.score - a.score)
                .map((p) => (
                  <li key={p.i} className="flex items-center justify-between rounded-2xl bg-ink/5 px-4 py-2.5">
                    <span className="font-semibold">
                      {game.result.winners.includes(p.i) && "🏆 "}
                      {p.name}
                    </span>
                    <span className="tabnum text-lg font-black">{p.score}</span>
                  </li>
                ))}
            </ol>
            <Button variant="accent" className="w-full" onClick={leave}>
              New game
            </Button>
          </>
        )}
      </Modal>
    </main>
  );
}
