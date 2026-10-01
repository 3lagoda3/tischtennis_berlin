"use client";

import { SIZE, CENTER, PREMIUM, idx } from "../../lib/scrabble/engine";
import { Tile } from "./Tile";

const PREM_STYLE = {
  TW: "bg-ball text-white",
  DW: "bg-ball/30 text-ball",
  TL: "bg-ink/70 text-paper",
  DL: "bg-ink/15 text-ink/70",
};

export function Board({ board, pending, last, canDrop, onCell, onPendingDown }) {
  const pend = new Map(pending.map((p) => [idx(p.r, p.c), p]));
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const i = idx(r, c);
      const cell = board[i];
      const p = pend.get(i);
      const prem = PREMIUM[i];
      const centre = r === CENTER && c === CENTER;

      let inner = null;
      if (cell) {
        inner = (
          <Tile
            l={cell.l}
            blank={cell.b}
            size="board"
            className={`h-full w-full ${last.has(i) ? "animate-bounce-in ring-2 ring-ink/60" : ""}`}
          />
        );
      } else if (p) {
        inner = (
          <Tile
            l={p.l}
            blank={p.blank}
            size="board"
            ring
            className="h-full w-full cursor-grab"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => onPendingDown(e, p)}
          />
        );
      } else if (centre) {
        inner = <span className="h-[46%] w-[46%] rounded-full bg-ball shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.25)]" />;
      } else if (prem) {
        inner = <span className="font-bold leading-none" style={{ fontSize: "1.9cqw" }}>{prem}</span>;
      }

      cells.push(
        <div
          key={i}
          data-cell={i}
          onClick={() => !cell && !p && onCell(r, c)}
          className={`flex aspect-square items-center justify-center rounded-[14%] ${
            cell || p ? "" : prem ? PREM_STYLE[prem] : "bg-ink/[0.07]"
          } ${!cell && !p && canDrop ? "cursor-pointer" : ""}`}
        >
          {inner}
        </div>
      );
    }
  }

  return (
    <div className="rounded-2xl bg-ink/10 p-1.5 ring-1 ring-ink/10" style={{ containerType: "inline-size" }}>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
        {cells}
      </div>
    </div>
  );
}
