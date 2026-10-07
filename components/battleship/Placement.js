"use client";

import { useMemo, useState } from "react";
import { Button } from "../ui";
import { Grid } from "./Grid";
import { SIZE, FLEET, rc, shipCells, clampAnchor, fits, randomFleet } from "../../lib/battleship/engine";

// Arrange your fleet: tap a square to drop the selected ship there, tap a placed
// ship to pick it back up. Or just hit Random.
export function Placement({ initial = [], onReady, busy }) {
  const [ships, setShips] = useState(initial);
  const [sel, setSel] = useState(null);
  const [vertical, setVertical] = useState(false);
  const [hover, setHover] = useState(null);

  const placed = new Set(ships.map((s) => s.id));
  const current = sel != null && !placed.has(sel) ? sel : FLEET.findIndex((_, id) => !placed.has(id));
  const done = current < 0;

  function candidate(i) {
    if (done) return null;
    const len = FLEET[current];
    const [r, c] = clampAnchor(len, ...rc(i), vertical);
    const cells = shipCells(len, r, c, vertical);
    return { cells, ok: !!cells && fits(ships, cells) };
  }

  const preview = hover != null && !ships.some((s) => s.cells.includes(hover)) ? candidate(hover) : null;

  const cells = useMemo(() => {
    const out = Array.from({ length: SIZE * SIZE }, () => ({ kind: "water" }));
    for (const s of ships) for (const x of s.cells) out[x] = { kind: "ship" };
    if (preview) for (const x of preview.cells) out[x] = { kind: preview.ok ? "preview" : "bad" };
    return out;
  }, [ships, preview]);

  function tap(i) {
    const hitShip = ships.find((s) => s.cells.includes(i));
    if (hitShip) {
      setShips((ss) => ss.filter((s) => s !== hitShip));
      setSel(hitShip.id);
      setVertical(!!hitShip.v);
      return;
    }
    const cand = candidate(i);
    if (!cand?.ok) return;
    setShips((ss) => [...ss, { id: current, len: FLEET[current], cells: cand.cells, v: vertical }]);
    setSel(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-paper p-4 ring-1 ring-ink/10">
        <h2 className="text-lg font-black tracking-tight">Place your fleet</h2>
        <p className="text-sm text-ink/50">
          {done
            ? "All ten ships are in the water. Ready?"
            : "Pick a ship, then tap a square. Ships can’t touch, not even at the corners. Tap a placed ship to move it."}
        </p>

        {/* Ship palette */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FLEET.map((len, id) => {
            const isPlaced = placed.has(id);
            const active = id === current;
            return (
              <button
                key={id}
                onClick={() => !isPlaced && setSel(id)}
                disabled={isPlaced}
                aria-label={`Ship of ${len}`}
                className={`flex gap-[2px] rounded-full px-2.5 py-2 transition ${
                  active ? "bg-ink ring-2 ring-ball" : isPlaced ? "opacity-25" : "bg-ink/[0.06] hover:bg-ink/10"
                }`}
              >
                {Array.from({ length: len }, (_, k) => (
                  <span key={k} className={`h-2.5 w-2.5 rounded-[3px] ${active ? "bg-ball" : "bg-ink/70"}`} />
                ))}
              </button>
            );
          })}
        </div>
      </div>

      <Grid cells={cells} onCell={tap} onHover={setHover} canTap={() => true} />

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => setVertical((v) => !v)} disabled={done}>
          {vertical ? "↕ Down" : "↔ Across"}
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => {
            setShips(randomFleet());
            setSel(null);
          }}
        >
          Random
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => setShips([])} disabled={!ships.length}>
          Clear
        </Button>
      </div>
      <Button variant="accent" className="w-full" disabled={!done || busy} onClick={() => onReady(ships)}>
        Ready, let’s go
      </Button>
    </div>
  );
}
