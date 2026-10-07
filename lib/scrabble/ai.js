// Computer player: Appel–Jacobson move generation over a trie, with cross-checks.
import { SIZE, CENTER, VALUES, evaluateMove, LANGS } from "./engine";

function trieHas(root, s) {
  let n = root;
  for (let i = 0; i < s.length; i++) {
    n = n.c[s[i]];
    if (!n) return false;
  }
  return n.e;
}

/** Every legal play for `rack` on `board`, scored. Stops early after `budgetMs`. */
export function generateMoves(board, rack, root, budgetMs = 1500, alphabet = LANGS.en.alphabet) {
  const deadline = Date.now() + budgetMs;
  const first = !board[CENTER * SIZE + CENTER];
  const found = new Map();

  for (const transposed of [false, true]) {
    const grid = Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => board[transposed ? c * SIZE + r : r * SIZE + c])
    );
    genAcross(grid, rack, root, first, deadline, alphabet, (placed) => {
      const ps = placed.map((p) => (transposed ? { r: p.c, c: p.r, l: p.l, b: p.b } : p));
      const key = ps.map((p) => `${p.r},${p.c},${p.l}`).sort().join("|");
      if (!found.has(key)) found.set(key, ps);
    });
  }

  const moves = [];
  for (const ps of found.values()) {
    const ev = evaluateMove(board, ps, first);
    if (ev.ok) moves.push({ placements: ps, score: ev.score, evaluation: ev });
  }
  return moves.sort((a, b) => b.score - a.score);
}

function genAcross(grid, rack, root, first, deadline, alphabet, emit) {
  const counts = {};
  let blanks = 0;
  for (const t of rack) t === "?" ? blanks++ : (counts[t] = (counts[t] || 0) + 1);

  // Cross-checks + anchors.
  const cc = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
  const anchor = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c]) continue;
      let up = "", down = "";
      for (let k = r - 1; k >= 0 && grid[k][c]; k--) up = grid[k][c].l + up;
      for (let k = r + 1; k < SIZE && grid[k][c]; k++) down += grid[k][c].l;
      if (up || down) {
        const ok = new Set();
        for (const ch of alphabet) if (trieHas(root, up + ch + down)) ok.add(ch);
        cc[r][c] = ok;
      }
      const touches =
        up || down || (c > 0 && grid[r][c - 1]) || (c < SIZE - 1 && grid[r][c + 1]);
      anchor[r][c] = first ? r === CENTER && c === CENTER : !!touches;
    }
  }

  let ops = 0;
  const timedOut = () => (++ops & 1023) === 0 && Date.now() > deadline;
  let dead = false;

  function extendRight(r, anc, sq, node, placed) {
    if (dead) return;
    if (timedOut()) { dead = true; return; }
    if (sq >= SIZE || !grid[r][sq]) {
      if (node.e && sq > anc && placed.length) emit(placed.slice());
      if (sq >= SIZE) return;
      const allowed = cc[r][sq];
      for (const ch in node.c) {
        if (allowed !== null && !allowed.has(ch)) continue;
        const child = node.c[ch];
        if (counts[ch] > 0) {
          counts[ch]--;
          placed.push({ r, c: sq, l: ch, b: false });
          extendRight(r, anc, sq + 1, child, placed);
          placed.pop();
          counts[ch]++;
        }
        if (blanks > 0) {
          blanks--;
          placed.push({ r, c: sq, l: ch, b: true });
          extendRight(r, anc, sq + 1, child, placed);
          placed.pop();
          blanks++;
        }
      }
    } else {
      const child = node.c[grid[r][sq].l];
      if (child) extendRight(r, anc, sq + 1, child, placed);
    }
  }

  function leftPart(r, anc, node, left, limit) {
    if (dead) return;
    const placed = left.map((t, k) => ({ r, c: anc - left.length + k, l: t.l, b: t.b }));
    extendRight(r, anc, anc, node, placed);
    if (limit <= 0) return;
    for (const ch in node.c) {
      const child = node.c[ch];
      if (counts[ch] > 0) {
        counts[ch]--;
        left.push({ l: ch, b: false });
        leftPart(r, anc, child, left, limit - 1);
        left.pop();
        counts[ch]++;
      }
      if (blanks > 0) {
        blanks--;
        left.push({ l: ch, b: true });
        leftPart(r, anc, child, left, limit - 1);
        left.pop();
        blanks++;
      }
    }
  }

  for (let r = 0; r < SIZE && !dead; r++) {
    for (let c = 0; c < SIZE && !dead; c++) {
      if (!anchor[r][c]) continue;
      if (c > 0 && grid[r][c - 1]) {
        let c0 = c;
        while (c0 > 0 && grid[r][c0 - 1]) c0--;
        let node = root;
        for (let k = c0; k < c && node; k++) node = node.c[grid[r][k].l];
        if (node) extendRight(r, c, c, node, []);
      } else {
        let limit = 0;
        for (let k = c - 1; k >= 0 && !grid[r][k] && !anchor[r][k]; k--) limit++;
        leftPart(r, c, root, [], limit);
      }
    }
  }
}

// Rough value of the tiles an AI keeps after a play (only used on "hard").
function leave(rack, used) {
  const left = [...rack];
  for (const t of used) left.splice(left.indexOf(t), 1);
  let v = 0;
  const seen = {};
  for (const t of left) {
    if (t === "?") v += 22;
    else if (t === "S") v += 7;
    else if ("ERTLN".includes(t)) v += 1;
    else if (VALUES[t] >= 8) v -= 6; // Q, Ґ, Щ… hard to place
    else if (VALUES[t] >= 4) v -= 2;
    seen[t] = (seen[t] || 0) + 1;
    if (seen[t] > 1 && t !== "?") v -= 3;
  }
  return v;
}

/** Pick a move for the given difficulty, or null if nothing is playable. */
export function chooseMove(moves, rack, level) {
  if (!moves.length) return null;
  if (level === "easy") {
    // Plays something legal, but rarely the best — the weaker 2/3 of the list.
    const start = Math.floor(moves.length / 3);
    return moves[start + Math.floor(Math.random() * (moves.length - start))];
  }
  if (level === "normal") {
    const pool = moves.slice(0, Math.max(1, Math.ceil(moves.length * 0.25)));
    return pool[Math.floor(Math.random() * pool.length)];
  }
  let best = null, bestV = -Infinity;
  for (const m of moves.slice(0, 60)) {
    const used = m.placements.map((p) => (p.b ? "?" : p.l));
    const v = m.score + leave(rack, used);
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}
