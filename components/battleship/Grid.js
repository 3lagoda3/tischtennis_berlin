"use client";

import { SIZE, COLS } from "../../lib/battleship/engine";

const BASE = {
  water: "bg-ink/[0.06]",
  ship: "bg-ink/80",
  ghost: "bg-ink/25", // enemy ship revealed after the game
  miss: "bg-ink/[0.06]",
  cleared: "bg-ink/[0.025]",
  hit: "bg-ball/25",
  sunk: "bg-ball",
  preview: "bg-ball/60",
  bad: "bg-ink/20 ring-1 ring-inset ring-ball",
};

/**
 * 10×10 board with A–J / 1–10 labels.
 * `cells[i]` = { kind, last } where kind is one of the BASE keys.
 */
export function Grid({ cells, onCell, onHover, canTap }) {
  const rows = [];
  for (let r = 0; r < SIZE; r++) {
    rows.push(
      <span key={`r${r}`} className="flex items-center justify-center font-bold text-ink/35" style={{ fontSize: "3cqw" }}>
        {r + 1}
      </span>
    );
    for (let c = 0; c < SIZE; c++) {
      const i = r * SIZE + c;
      const { kind, last } = cells[i];
      const tappable = canTap?.(i);
      rows.push(
        <button
          key={i}
          type="button"
          tabIndex={tappable ? 0 : -1}
          aria-label={`${COLS[c]}${r + 1}`}
          onClick={() => tappable && onCell?.(i)}
          onPointerEnter={(e) => e.pointerType === "mouse" && onHover?.(i)}
          className={`relative flex aspect-square items-center justify-center rounded-[18%] transition-colors ${BASE[kind]} ${
            tappable ? `cursor-pointer ${kind === "water" ? "hover:bg-ink/15" : ""}` : "cursor-default"
          } ${last ? "animate-bounce-in ring-2 ring-ink/70" : ""}`}
        >
          {kind === "miss" && <span className="h-[24%] w-[24%] rounded-full bg-ink/40" />}
          {kind === "cleared" && <span className="h-[18%] w-[18%] rounded-full bg-ink/15" />}
          {(kind === "hit" || kind === "sunk") && (
            <span
              className={`font-black leading-none ${kind === "sunk" ? "text-white" : "text-ball"}`}
              style={{ fontSize: "4.6cqw" }}
            >
              ✕
            </span>
          )}
        </button>
      );
    }
  }

  return (
    <div
      className="rounded-2xl bg-paper p-1.5 ring-1 ring-ink/10 sm:p-2"
      style={{ containerType: "inline-size" }}
      onPointerLeave={() => onHover?.(null)}
    >
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${SIZE + 1}, minmax(0, 1fr))` }}>
        <span />
        {COLS.split("").map((l) => (
          <span key={l} className="flex items-end justify-center pb-0.5 font-bold text-ink/35" style={{ fontSize: "3cqw" }}>
            {l}
          </span>
        ))}
        {rows}
      </div>
    </div>
  );
}

/** Remaining-fleet strip: one bar of squares per ship, sunk ones in orange. */
export function FleetStrip({ ships, shots }) {
  const sorted = [...ships].sort((a, b) => b.len - a.len || a.id - b.id);
  return (
    <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5">
      {sorted.map((s) => {
        const sunk = s.cells.every((x) => shots[x] === 2);
        return (
          <span key={s.id} className="flex gap-[2px]" title={sunk ? "Sunk" : "Afloat"}>
            {Array.from({ length: s.len }, (_, k) => (
              <span key={k} className={`h-2.5 w-2.5 rounded-[3px] ${sunk ? "bg-ball" : "bg-ink/25"}`} />
            ))}
          </span>
        );
      })}
    </div>
  );
}
