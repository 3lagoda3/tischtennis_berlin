// Battleship — classic Soviet rules: 10×10, fleet 4·3·3·2·2·2·1·1·1·1,
// ships may not touch (not even diagonally), a hit earns another shot.

export const SIZE = 10;
export const FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
export const COLS = "ABCDEFGHIJ";

// Shot marks on a player's own board.
export const UNKNOWN = 0;
export const MISS = 1;
export const HIT = 2;
export const CLEARED = 3; // water next to a sunk ship — auto-marked

export const idx = (r, c) => r * SIZE + c;
export const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
export const label = (i) => COLS[i % SIZE] + (Math.floor(i / SIZE) + 1);
const inside = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export function neighbours(i, diagonal = true) {
  const [r, c] = rc(i);
  const out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!diagonal && dr && dc) continue;
      if (inside(r + dr, c + dc)) out.push(idx(r + dr, c + dc));
    }
  return out;
}

/** Cells covered by a ship anchored at (r, c), or null if it sticks out of the board. */
export function shipCells(len, r, c, vertical) {
  const cells = [];
  for (let k = 0; k < len; k++) {
    const rr = vertical ? r + k : r;
    const cc = vertical ? c : c + k;
    if (!inside(rr, cc)) return null;
    cells.push(idx(rr, cc));
  }
  return cells;
}

/** Nudge an anchor back onto the board so a tap near the edge still places the ship. */
export function clampAnchor(len, r, c, vertical) {
  return vertical ? [Math.min(r, SIZE - len), c] : [r, Math.min(c, SIZE - len)];
}

/** True if `cells` neither overlaps nor touches any of `ships`. */
export function fits(ships, cells) {
  const blocked = new Set();
  for (const s of ships)
    for (const x of s.cells) {
      blocked.add(x);
      for (const n of neighbours(x)) blocked.add(n);
    }
  return cells.every((x) => !blocked.has(x));
}

export function randomFleet() {
  for (;;) {
    const ships = [];
    let ok = true;
    for (let id = 0; id < FLEET.length && ok; id++) {
      const len = FLEET[id];
      ok = false;
      for (let t = 0; t < 300; t++) {
        const v = Math.random() < 0.5;
        const cells = shipCells(len, Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE), v);
        if (cells && fits(ships, cells)) {
          ships.push({ id, len, cells, v });
          ok = true;
          break;
        }
      }
    }
    if (ok) return ships;
  }
}

export const isSunk = (ship, shots) => ship.cells.every((x) => shots[x] === HIT);

export function createGame(players, first = 0) {
  return {
    players: players.map((p) => ({
      name: p.name,
      ai: p.ai || null,
      ships: p.ai ? randomFleet() : [],
      ready: !!p.ai,
      shots: Array(SIZE * SIZE).fill(UNKNOWN), // shots fired AT this player
    })),
    phase: "placing", // placing | battle | over
    first,
    turn: first,
    winner: null,
    last: null, // { by, i, result, len }
    moves: 0,
  };
}

/** Lock in a player's fleet. Once both are ready, the battle starts. */
export function setFleet(game, seat, ships) {
  const players = game.players.map((p, k) =>
    k === seat ? { ...p, ships: ships.map(({ id, len, cells, v }) => ({ id, len, cells, v: !!v })), ready: true } : p
  );
  const go = players.every((p) => p.ready);
  return { ...game, players, phase: go ? "battle" : "placing", turn: game.first };
}

/** Fire at cell `i` of the opponent's board. Returns null if the shot isn't allowed. */
export function fire(game, seat, i) {
  if (game.phase !== "battle" || game.turn !== seat) return null;
  const t = 1 - seat;
  const target = game.players[t];
  if (target.shots[i] !== UNKNOWN) return null;

  const shots = [...target.shots];
  const ship = target.ships.find((s) => s.cells.includes(i));
  let result = "miss";
  if (ship) {
    shots[i] = HIT;
    result = "hit";
    if (isSunk(ship, shots)) {
      result = "sunk";
      for (const x of ship.cells) for (const n of neighbours(x)) if (shots[n] === UNKNOWN) shots[n] = CLEARED;
    }
  } else {
    shots[i] = MISS;
  }

  const won = target.ships.every((s) => isSunk(s, shots));
  return {
    ...game,
    players: game.players.map((p, k) => (k === t ? { ...p, shots } : p)),
    turn: result === "miss" ? t : seat,
    phase: won ? "over" : "battle",
    winner: won ? seat : null,
    last: { by: seat, i, result, len: ship ? ship.len : 0 },
    moves: game.moves + 1,
  };
}

/** Same two players, fresh boards; the other player shoots first this time. */
export function rematch(game) {
  const first = 1 - game.first;
  const next = createGame(game.players, first);
  next.players = next.players.map((p, k) => ({ ...p, token: game.players[k].token }));
  return next;
}

export const shotsFired = (game, seat) =>
  game.players[1 - seat].shots.filter((s) => s === MISS || s === HIT).length;
