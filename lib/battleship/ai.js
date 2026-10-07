// Computer gunner. Only uses public information: where it has shot, what it hit,
// and which ships it has sunk ("убил" is announced, so that's fair).
import { SIZE, FLEET, UNKNOWN, HIT, rc, idx, neighbours, shipCells, isSunk } from "./engine";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function analyse(shots, ships) {
  const sunkCells = new Set();
  const left = [...FLEET];
  for (const s of ships)
    if (isSunk(s, shots)) {
      s.cells.forEach((x) => sunkCells.add(x));
      left.splice(left.indexOf(s.len), 1);
    }
  const open = []; // cells with an unsunk hit
  for (let i = 0; i < shots.length; i++) if (shots[i] === HIT && !sunkCells.has(i)) open.push(i);
  // Ships never touch diagonally, so diagonal neighbours of a hit are water.
  const water = new Set();
  for (const h of open)
    for (const n of neighbours(h)) {
      const [a, b] = rc(h), [c, d] = rc(n);
      if (a !== c && b !== d) water.add(n);
    }
  const free = [];
  for (let i = 0; i < shots.length; i++) if (shots[i] === UNKNOWN && !water.has(i)) free.push(i);
  return { open, left, free: new Set(free), freeList: free };
}

// Hits in a line → extend the ends; single hit → try its four sides.
function targetCells(open, free) {
  if (!open.length) return [];
  if (open.length === 1) return neighbours(open[0], false).filter((n) => free.has(n));
  const pts = open.map(rc);
  const row = pts.every(([r]) => r === pts[0][0]);
  const vals = pts.map(([r, c]) => (row ? c : r)).sort((a, b) => a - b);
  const fixed = row ? pts[0][0] : pts[0][1];
  const ends = [vals[0] - 1, vals[vals.length - 1] + 1].filter((v) => v >= 0 && v < SIZE);
  return ends.map((v) => (row ? idx(fixed, v) : idx(v, fixed))).filter((n) => free.has(n));
}

// Count every legal placement of every remaining ship; shoot where most of them overlap.
function density(shots, open, left, free) {
  const openSet = new Set(open);
  const score = new Array(SIZE * SIZE).fill(0);
  for (const len of new Set(left)) {
    const mult = left.filter((l) => l === len).length;
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        for (const v of len === 1 ? [false] : [false, true]) {
          const cells = shipCells(len, r, c, v);
          if (!cells) continue;
          let covered = 0, bad = false;
          for (const x of cells) {
            if (openSet.has(x)) covered++;
            else if (!free.has(x)) { bad = true; break; }
          }
          if (bad) continue;
          // A ship can't sit next to an unsunk hit it doesn't include.
          const mine = new Set(cells);
          if (cells.some((x) => neighbours(x).some((n) => openSet.has(n) && !mine.has(n)))) continue;
          if (open.length && !covered) continue;
          const w = mult * (1 + covered * 50);
          for (const x of cells) if (!openSet.has(x)) score[x] += w;
        }
  }
  let best = 0, out = [];
  score.forEach((s, i) => {
    if (s > best) (best = s), (out = [i]);
    else if (s === best && s > 0) out.push(i);
  });
  return out;
}

/** Pick the next cell to shoot at the opponent whose board is (shots, ships). */
export function chooseShot(shots, ships, level = "normal") {
  const { open, left, free, freeList } = analyse(shots, ships);
  const fallback = freeList.length ? freeList : shots.map((s, i) => (s === UNKNOWN ? i : -1)).filter((i) => i >= 0);

  if (level === "easy") {
    const t = targetCells(open, free);
    return t.length && Math.random() < 0.35 ? pick(t) : pick(fallback);
  }
  if (level === "hard") {
    const best = density(shots, open, left, free);
    return best.length ? pick(best) : pick(fallback);
  }
  // normal: hunt on a checkerboard, then finish what it hit
  const t = targetCells(open, free);
  if (t.length) return pick(t);
  const parity = freeList.filter((i) => {
    const [r, c] = rc(i);
    return (r + c) % 2 === 0;
  });
  return pick(parity.length ? parity : fallback);
}
