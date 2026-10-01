// Scrabble rules engine — pure functions, no React. Standard English edition:
// 15×15 board, 100 tiles, 7-tile racks, 50-point bingo.

export const SIZE = 15;
export const CENTER = 7;
export const RACK_SIZE = 7;

export const DISTRIBUTION = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, "?": 2,
};

export const VALUES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10, "?": 0,
};

const PREMIUM_CELLS = {
  TW: [[0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14]],
  DW: [
    [1, 1], [2, 2], [3, 3], [4, 4], [1, 13], [2, 12], [3, 11], [4, 10],
    [13, 1], [12, 2], [11, 3], [10, 4], [13, 13], [12, 12], [11, 11], [10, 10], [7, 7],
  ],
  TL: [[1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13], [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9]],
  DL: [
    [0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14], [6, 2], [6, 6], [6, 8], [6, 12],
    [7, 3], [7, 11], [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14],
    [12, 6], [12, 8], [14, 3], [14, 11],
  ],
};

// PREMIUM[r * 15 + c] → "TW" | "DW" | "TL" | "DL" | undefined
export const PREMIUM = {};
for (const [kind, cells] of Object.entries(PREMIUM_CELLS)) {
  for (const [r, c] of cells) PREMIUM[r * SIZE + c] = kind;
}

export const idx = (r, c) => r * SIZE + c;

export function freshBag() {
  const bag = [];
  for (const [l, n] of Object.entries(DISTRIBUTION)) for (let i = 0; i < n; i++) bag.push(l);
  return shuffle(bag);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const rackPoints = (rack) => rack.reduce((s, t) => s + VALUES[t], 0);

// Board cell: null | { l: "A".."Z", b: boolean (was a blank) }.
// Placement: { r, c, l, b }.

/**
 * Check the geometry of a move and score it. Does NOT check the dictionary —
 * the caller does that against `result.words`.
 * Returns { ok, error?, words: [{ word, score }], score }.
 */
export function evaluateMove(board, placements, firstMove) {
  const fail = (error) => ({ ok: false, error, words: [], score: 0 });
  if (!placements.length) return fail("Place at least one tile.");

  const grid = board.slice();
  for (const p of placements) {
    if (grid[idx(p.r, p.c)]) return fail("Square already taken.");
    grid[idx(p.r, p.c)] = { l: p.l, b: p.b, fresh: true };
  }

  const rows = new Set(placements.map((p) => p.r));
  const cols = new Set(placements.map((p) => p.c));
  if (rows.size > 1 && cols.size > 1) return fail("Tiles must sit in one row or column.");

  // No gaps between the outermost new tiles.
  if (rows.size === 1) {
    const r = placements[0].r;
    const cs = placements.map((p) => p.c);
    for (let c = Math.min(...cs); c <= Math.max(...cs); c++) if (!grid[idx(r, c)]) return fail("No gaps allowed.");
  } else {
    const c = placements[0].c;
    const rs = placements.map((p) => p.r);
    for (let r = Math.min(...rs); r <= Math.max(...rs); r++) if (!grid[idx(r, c)]) return fail("No gaps allowed.");
  }

  if (firstMove && !grid[idx(CENTER, CENTER)]) return fail("First word must cover the centre star.");

  // Collect every run of ≥2 letters through a new tile, across and down.
  const seen = new Set();
  const runs = [];
  for (const p of placements) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      let r = p.r, c = p.c;
      while (r - dr >= 0 && c - dc >= 0 && grid[idx(r - dr, c - dc)]) { r -= dr; c -= dc; }
      const key = `${dr}:${r}:${c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const cells = [];
      while (r < SIZE && c < SIZE && grid[idx(r, c)]) { cells.push([r, c]); r += dr; c += dc; }
      if (cells.length >= 2) runs.push(cells);
    }
  }
  if (!runs.length) return fail("Words need at least two letters.");

  if (!firstMove) {
    const touches = runs.some((cells) => cells.some(([r, c]) => !grid[idx(r, c)].fresh));
    if (!touches) return fail("Your word must connect to the tiles on the board.");
  }

  let total = 0;
  const words = runs.map((cells) => {
    let sum = 0, mult = 1;
    for (const [r, c] of cells) {
      const cell = grid[idx(r, c)];
      let v = cell.b ? 0 : VALUES[cell.l];
      if (cell.fresh) {
        const prem = PREMIUM[idx(r, c)];
        if (prem === "DL") v *= 2;
        else if (prem === "TL") v *= 3;
        else if (prem === "DW") mult *= 2;
        else if (prem === "TW") mult *= 3;
      }
      sum += v;
    }
    const score = sum * mult;
    total += score;
    return { word: cells.map(([r, c]) => grid[idx(r, c)].l).join(""), score };
  });

  if (placements.length === RACK_SIZE) total += 50; // bingo
  return { ok: true, words, score: total, bingo: placements.length === RACK_SIZE };
}

// ───────────────────────── game state ─────────────────────────

/** players: [{ name, ai: null | "easy" | "normal" | "hard" }] */
export function createGame(players) {
  let bag = freshBag();
  const ps = players.map((p) => {
    const rack = bag.splice(0, RACK_SIZE);
    return { name: p.name, ai: p.ai || null, score: 0, rack };
  });
  return {
    players: ps,
    board: Array(SIZE * SIZE).fill(null),
    bag,
    turn: Math.floor(Math.random() * ps.length),
    scoreless: 0, // consecutive scoreless turns (pass / swap)
    history: [],
    lastMove: [],
    over: false,
    result: null,
  };
}

const clone = (g) => ({
  ...g,
  players: g.players.map((p) => ({ ...p, rack: [...p.rack] })),
  board: [...g.board],
  bag: [...g.bag],
  history: [...g.history],
});

export const isFirstMove = (g) => !g.board[idx(CENTER, CENTER)];

function advance(g) {
  g.turn = (g.turn + 1) % g.players.length;
}

function finish(g, wentOut) {
  // Everyone loses their leftover tiles; a player who went out collects them.
  let pool = 0;
  g.players.forEach((p, i) => {
    const left = rackPoints(p.rack);
    p.score -= left;
    if (i !== wentOut) pool += left;
  });
  if (wentOut != null) g.players[wentOut].score += pool;
  const top = Math.max(...g.players.map((p) => p.score));
  g.over = true;
  g.result = { winners: g.players.map((p, i) => (p.score === top ? i : -1)).filter((i) => i >= 0), wentOut };
  return g;
}

/** Apply an already-validated play. `words` comes from evaluateMove. */
export function applyPlay(game, placements, evaluation) {
  const g = clone(game);
  const p = g.players[g.turn];
  for (const t of placements) {
    const tile = t.b ? "?" : t.l;
    p.rack.splice(p.rack.indexOf(tile), 1);
    g.board[idx(t.r, t.c)] = { l: t.l, b: t.b };
  }
  p.score += evaluation.score;
  p.rack.push(...g.bag.splice(0, Math.min(RACK_SIZE - p.rack.length, g.bag.length)));
  g.scoreless = 0;
  g.lastMove = placements.map((t) => idx(t.r, t.c));
  g.history.push({
    player: g.turn, type: "play", score: evaluation.score,
    words: evaluation.words.map((w) => w.word), bingo: !!evaluation.bingo,
  });
  if (!p.rack.length) return finish(g, g.turn);
  advance(g);
  return g;
}

export function applyPass(game) {
  const g = clone(game);
  g.history.push({ player: g.turn, type: "pass", score: 0 });
  g.scoreless += 1;
  g.lastMove = [];
  if (g.scoreless >= 6) return finish(g, null);
  advance(g);
  return g;
}

/** Swap the given tiles (array of tile chars) for fresh ones. Needs a full rack's worth in the bag. */
export function applySwap(game, tiles) {
  if (game.bag.length < RACK_SIZE || !tiles.length) return null;
  const g = clone(game);
  const p = g.players[g.turn];
  for (const t of tiles) p.rack.splice(p.rack.indexOf(t), 1);
  const drawn = g.bag.splice(0, tiles.length);
  g.bag = shuffle([...g.bag, ...tiles]);
  p.rack.push(...drawn);
  g.history.push({ player: g.turn, type: "swap", score: 0, count: tiles.length });
  g.scoreless += 1;
  g.lastMove = [];
  if (g.scoreless >= 6) return finish(g, null);
  advance(g);
  return g;
}

export function reorderRack(game, rack) {
  const g = clone(game);
  g.players[g.turn].rack = rack;
  return g;
}
