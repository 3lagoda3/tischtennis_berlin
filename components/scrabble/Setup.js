"use client";

import { useEffect, useState } from "react";
import { Button, PingBall } from "../ui";
import { LANGS } from "../../lib/scrabble/engine";
import { fetchOurWords } from "../../lib/scrabble/ourWords";

const LANG_KEY = "berlin-scrabble-lang";

// The shared list of friend-accepted words, grouped by where they're from.
function OurWords({ lang }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    setRows(null);
    fetchOurWords(lang).then(setRows);
  }, [lang]);
  if (!rows || !rows.length) return null;
  const groups = {};
  for (const r of rows) (groups[r.region || "—"] ||= []).push(r.word);
  return (
    <details className="mt-3 text-sm text-ink/60">
      <summary className="cursor-pointer font-semibold text-ink/70">
        Наші слова · {rows.length} accepted by friends
      </summary>
      <div className="mt-2 space-y-2">
        {Object.entries(groups).map(([region, words]) => (
          <div key={region}>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/40">{region}</p>
            <p className="font-semibold text-ink/80">{words.join(" · ")}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

const LEVELS = [
  ["easy", "Easy"],
  ["normal", "Normal"],
  ["hard", "Hard"],
];

export function Setup({ onStart, onResume, canResume, onOnline }) {
  const [hostName, setHostName] = useState("");
  const [lang, setLangState] = useState("en");
  useEffect(() => {
    try {
      const l = localStorage.getItem(LANG_KEY);
      if (LANGS[l]) setLangState(l);
    } catch {}
  }, []);
  const setLang = (l) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };
  const [players, setPlayers] = useState([
    { name: "You", ai: null },
    { name: "Computer", ai: "normal" },
  ]);

  const set = (i, patch) => setPlayers((ps) => ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const add = () =>
    setPlayers((ps) => [...ps, { name: `Player ${ps.length + 1}`, ai: null }]);
  const remove = (i) => setPlayers((ps) => ps.filter((_, k) => k !== i));

  const start = () =>
    onStart(
      players.map((p, i) => ({
        name: p.name.trim() || (p.ai ? "Computer" : `Player ${i + 1}`),
        ai: p.ai,
      })),
      lang
    );

  return (
    <div className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <PingBall className="h-6 w-6 shrink-0" />
        <div>
          <h2 className="text-lg font-black tracking-tight">New game</h2>
          <p className="text-sm text-ink/50">2–4 players · pass the phone around, or play the computer.</p>
        </div>
      </div>

      {/* Language */}
      <div className="mb-4">
        <div className="flex rounded-full bg-ink/[0.06] p-1 text-sm font-bold">
          {Object.values(LANGS).map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`flex-1 rounded-full px-3 py-2 transition ${
                lang === l.id ? "bg-ink text-paper" : "text-ink/50 hover:text-ink"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
        <p className="mt-2 px-1 text-xs text-ink/50">{LANGS[lang].rule}</p>
        <OurWords lang={lang} />
      </div>

      <ul className="space-y-2">
        {players.map((p, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-2xl bg-ink/[0.04] p-2">
            <input
              value={p.name}
              onChange={(e) => set(i, { name: e.target.value })}
              maxLength={14}
              aria-label={`Player ${i + 1} name`}
              className="min-w-[8rem] flex-1 rounded-full bg-paper px-4 py-2 text-sm font-semibold outline-none ring-1 ring-ink/10 focus:ring-ball"
            />
            <div className="flex rounded-full bg-paper p-0.5 text-xs font-semibold ring-1 ring-ink/10">
              {[
                ["Human", null],
                ["Computer", "normal"],
              ].map(([label, val]) => (
                <button
                  key={label}
                  onClick={() =>
                    set(i, {
                      ai: val,
                      name: !val && p.name === "Computer" ? `Player ${i + 1}` : val && /^Player \d$|^You$/.test(p.name) ? "Computer" : p.name,
                    })
                  }
                  className={`rounded-full px-3 py-1.5 transition ${
                    (p.ai ? "Computer" : "Human") === label ? "bg-ink text-paper" : "text-ink/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {p.ai && (
              <select
                value={p.ai}
                onChange={(e) => set(i, { ai: e.target.value })}
                aria-label="Difficulty"
                className="rounded-full bg-paper px-3 py-2 text-xs font-semibold outline-none ring-1 ring-ink/10"
              >
                {LEVELS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            {players.length > 2 && (
              <button
                onClick={() => remove(i)}
                aria-label="Remove player"
                className="grid h-8 w-8 place-items-center rounded-full text-ink/40 hover:bg-ink/5 hover:text-ink"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {players.length < 4 && (
        <button onClick={add} className="mt-3 text-sm font-semibold text-ink/50 transition hover:text-ink">
          + Add player
        </button>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="accent" className="flex-1" onClick={start}>
          Start game
        </Button>
        {canResume && (
          <Button variant="ghost" className="flex-1" onClick={onResume}>
            Resume last game
          </Button>
        )}
      </div>

      {onOnline && (
        <div className="mt-6 rounded-2xl bg-ink/[0.04] p-4">
          <p className="text-sm font-bold">Play a friend online</p>
          <p className="mb-3 text-sm text-ink/50">
            You get a link to send. No sign-up for either of you.
          </p>
          <input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            maxLength={14}
            placeholder="Your name"
            aria-label="Your name for the online game"
            className="mb-2 w-full rounded-full bg-paper px-4 py-2 text-sm font-semibold outline-none ring-1 ring-ink/10 focus:ring-ball"
          />
          <Button variant="primary" className="w-full" onClick={() => onOnline(hostName, lang)}>
            Create online game
          </Button>
        </div>
      )}

      <details className="mt-6 text-sm text-ink/60">
        <summary className="cursor-pointer font-semibold text-ink/70">How it works</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Standard Scrabble: 100 tiles (104 in Ukrainian, apostrophe included), 7 on your rack, first word covers the centre ball.</li>
          <li>Orange squares multiply words (TW ×3, DW ×2); dark squares multiply letters (TL ×3, DL ×2).</li>
          <li>Use all 7 tiles in one turn for a 50-point bingo. Blank tiles score 0 and can be any letter.</li>
          <li>Words are checked against the dictionary before you can play them: ENABLE for English, the brown-uk dictionary for Ukrainian.</li>
          <li>Dialect word, slang, something from home? Place it anyway and tap “Ask to accept”. If a friend says yes, it counts, and it’s saved to Наші слова for every future game.</li>
          <li>The game ends when the bag is empty and someone plays their last tile, or after six scoreless turns in a row.</li>
        </ul>
      </details>
    </div>
  );
}
