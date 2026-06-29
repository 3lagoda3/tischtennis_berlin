// Tournament engine: schedule generation + advancement for four formats.
// A tournament's `data` blob holds an array of `fixtures`. Each fixture is one
// scheduled game; later-round fixtures point at earlier ones via `source1/2`
// and get their players filled in as results come in.
//
// Fixture: {
//   id, round, stage: "main"|"group"|"knockout", label, group,
//   p1, p2,                       // playerId | null (null = bye or TBD)
//   source1, source2,             // {fixtureId, take:"winner"} | null
//   matchId, score1, score2, winnerId, status: "pending"|"done"
// }

export const FORMATS = [
  {
    id: "duel",
    name: "Duel (1-v-1)",
    blurb: "Head-to-head race. Two players, first to your chosen number of game wins takes the crown. Great when it's just the two of you.",
    min: 2,
  },
  {
    id: "round_robin",
    name: "Round-robin",
    blurb: "Everyone plays everyone once. Fairest format — best for 4–6 players. Winner = most wins.",
    min: 3,
  },
  {
    id: "single_elim",
    name: "Single elimination",
    blurb: "Knockout bracket — lose once and you're out. Fast and dramatic. Byes for top seeds if needed.",
    min: 4,
  },
  {
    id: "groups_knockout",
    name: "Groups → knockout",
    blurb: "Round-robin groups, then the top finishers cross over into a knockout. World-Cup style — best for 8+.",
    min: 6,
  },
  {
    id: "swiss",
    name: "Swiss system",
    blurb: "A fixed number of rounds; each round you face someone on a similar record. No eliminations.",
    min: 4,
  },
];

export function formatName(id) {
  return FORMATS.find((f) => f.id === id)?.name || id;
}

// A distinct winner's badge per format — icon, short title, accent colour.
export const BADGES = {
  duel:            { icon: "⚔️", label: "Duelist",       color: "#ff5a1f" },
  round_robin:     { icon: "🏆", label: "League Champ",  color: "#f4b400" },
  single_elim:     { icon: "👑", label: "Knockout King", color: "#a855f7" },
  groups_knockout: { icon: "🌍", label: "Cup Winner",    color: "#06d6a0" },
  swiss:           { icon: "🎖️", label: "Swiss Master",  color: "#118ab2" },
};

export function badgeFor(format) {
  return BADGES[format] || BADGES.round_robin;
}

// ---- small helpers ------------------------------------------------------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newFixture(idc, props) {
  return {
    id: `f${idc}`,
    round: 0,
    stage: "main",
    label: "",
    group: null,
    p1: null,
    p2: null,
    source1: null,
    source2: null,
    matchId: null,
    score1: null,
    score2: null,
    winnerId: null,
    status: "pending",
    ...props,
  };
}

// Standard bracket seed positions for a power-of-two size (1-indexed seeds).
function seedOrder(size) {
  let rounds = Math.log2(size);
  let pls = [1, 2];
  for (let r = 1; r < rounds; r++) {
    const sum = pls.length * 2 + 1;
    const out = [];
    for (const p of pls) {
      out.push(p);
      out.push(sum - p);
    }
    pls = out;
  }
  return pls;
}

// ---- round robin --------------------------------------------------------

function genRoundRobin(playerIds, startId = 0, labelPrefix = "Round", group = null) {
  const ps = [...playerIds];
  if (ps.length % 2) ps.push(null); // bye slot
  const n = ps.length;
  const rounds = n - 1;
  const half = n / 2;
  const arr = [...ps];
  const fixtures = [];
  let idc = startId;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a != null && b != null) {
        fixtures.push(
          newFixture(++idc, {
            round: r,
            stage: group ? "group" : "main",
            label: group ? `${group} · ${labelPrefix} ${r + 1}` : `${labelPrefix} ${r + 1}`,
            group,
            p1: a,
            p2: b,
          })
        );
      }
    }
    // rotate, keeping the first element fixed
    arr.splice(1, 0, arr.pop());
  }
  return { fixtures, lastId: idc };
}

// ---- single elimination -------------------------------------------------

function roundLabel(roundIdx, totalRounds) {
  const left = totalRounds - roundIdx;
  if (left === 1) return "Final";
  if (left === 2) return "Semifinal";
  if (left === 3) return "Quarterfinal";
  return `Round ${roundIdx + 1}`;
}

function genSingleElim(seeds, startId = 0, stage = "knockout") {
  const n = seeds.length;
  let size = 1;
  while (size < n) size *= 2;
  const order = seedOrder(size);
  const slots = order.map((s) => (s <= n ? seeds[s - 1] : null));
  const totalRounds = Math.log2(size);
  const fixtures = [];
  let idc = startId;
  let prev = [];

  for (let r = 0; r < totalRounds; r++) {
    const count = size / Math.pow(2, r + 1);
    const cur = [];
    for (let i = 0; i < count; i++) {
      const f = newFixture(++idc, {
        round: r,
        stage,
        label: roundLabel(r, totalRounds),
      });
      if (r === 0) {
        f.p1 = slots[2 * i];
        f.p2 = slots[2 * i + 1];
      } else {
        f.source1 = { fixtureId: prev[2 * i].id, take: "winner" };
        f.source2 = { fixtureId: prev[2 * i + 1].id, take: "winner" };
      }
      cur.push(f);
      fixtures.push(f);
    }
    prev = cur;
  }
  return { fixtures, finalId: prev[0]?.id || null, lastId: idc };
}

// ---- public: generate ---------------------------------------------------

// seedRatings: optional Map<id, rating> used to seed brackets/groups.
export function generate(format, playerIds, settings = {}, seedRatings = null) {
  const seeds = seedRatings
    ? [...playerIds].sort((a, b) => (seedRatings.get(b) ?? 0) - (seedRatings.get(a) ?? 0))
    : shuffle(playerIds);

  const base = { format, playerIds: [...playerIds], settings, status: "active" };

  if (format === "duel") {
    const target = Math.max(1, Math.min(50, settings.target || 5));
    const [a, b] = seeds;
    const fixtures = [newFixture(1, { round: 0, label: "Game 1", p1: a, p2: b })];
    return { ...base, fixtures, duelTarget: target, lastId: 1 };
  }

  if (format === "round_robin") {
    const { fixtures } = genRoundRobin(seeds);
    return { ...base, fixtures };
  }

  if (format === "single_elim") {
    const { fixtures, finalId } = genSingleElim(seeds);
    return { ...base, fixtures, finalId };
  }

  if (format === "swiss") {
    const rounds = settings.rounds || Math.max(3, Math.ceil(Math.log2(seeds.length)) + 1);
    // Round 1: split field, top half vs bottom half.
    const half = Math.ceil(seeds.length / 2);
    const top = seeds.slice(0, half);
    const bot = seeds.slice(half);
    const fixtures = [];
    let idc = 0;
    for (let i = 0; i < half; i++) {
      const a = top[i];
      const b = bot[i] ?? null;
      if (a != null && b != null) {
        fixtures.push(newFixture(++idc, { round: 0, label: "Round 1", p1: a, p2: b }));
      } else if (a != null) {
        // bye → auto win
        fixtures.push(
          newFixture(++idc, { round: 0, label: "Round 1", p1: a, p2: null, winnerId: a, status: "done" })
        );
      }
    }
    return { ...base, fixtures, swissRounds: rounds, roundsGenerated: 1, lastId: idc };
  }

  if (format === "groups_knockout") {
    const n = seeds.length;
    const groupCount = settings.groups || (n <= 8 ? 2 : n <= 12 ? 3 : 4);
    const advancers = settings.advancers || 2;
    const groups = {};
    const names = "ABCDEFGH".split("");
    for (let i = 0; i < groupCount; i++) groups[names[i]] = [];
    // snake distribution by seed
    seeds.forEach((id, i) => {
      const round = Math.floor(i / groupCount);
      const pos = round % 2 === 0 ? i % groupCount : groupCount - 1 - (i % groupCount);
      groups[names[pos]].push(id);
    });

    let idc = 0;
    const fixtures = [];
    for (const g of Object.keys(groups)) {
      const res = genRoundRobin(groups[g], idc, "Round", g);
      idc = res.lastId;
      fixtures.push(...res.fixtures);
    }
    return {
      ...base,
      fixtures,
      groups,
      advancers,
      knockoutGenerated: false,
      lastId: idc,
    };
  }

  throw new Error(`Unknown format: ${format}`);
}

// ---- standings within a set of fixtures ---------------------------------

// Win/loss record over the given (done) fixtures. Returns sorted array.
export function fixtureStandings(fixtures, playerIds, seedRatings = null) {
  const rec = new Map(playerIds.map((id) => [id, { id, played: 0, won: 0, lost: 0, diff: 0 }]));
  for (const f of fixtures) {
    if (f.status !== "done" || !f.winnerId) continue;
    if (f.p1 == null || f.p2 == null) {
      // bye: count as a win, no opponent
      const r = rec.get(f.winnerId);
      if (r) r.won += 0; // byes don't pad the win count
      continue;
    }
    const a = rec.get(f.p1);
    const b = rec.get(f.p2);
    if (!a || !b) continue;
    a.played++; b.played++;
    a.diff += (f.score1 ?? 0) - (f.score2 ?? 0);
    b.diff += (f.score2 ?? 0) - (f.score1 ?? 0);
    if (f.winnerId === f.p1) { a.won++; b.lost++; }
    else { b.won++; a.lost++; }
  }
  return [...rec.values()].sort(
    (x, y) =>
      y.won - x.won ||
      y.diff - x.diff ||
      (seedRatings ? (seedRatings.get(y.id) ?? 0) - (seedRatings.get(x.id) ?? 0) : 0)
  );
}

// ---- advancement --------------------------------------------------------

function fixtureById(data, id) {
  return data.fixtures.find((f) => f.id === id);
}

function resolveSource(data, src) {
  if (!src) return undefined; // no source = use the static p value
  const f = fixtureById(data, src.fixtureId);
  if (!f || f.status !== "done") return null; // pending
  return src.take === "loser"
    ? f.winnerId === f.p1 ? f.p2 : f.p1
    : f.winnerId;
}

// Mutates `data`: fills resolved players, auto-resolves byes, generates the
// next swiss round / knockout stage, and sets completion + winner.
// Returns the (same) data object.
export function advance(data, seedRatings = null) {
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 50) {
    changed = false;

    for (const f of data.fixtures) {
      if (f.status === "done") continue;

      if (f.source1) {
        const r = resolveSource(data, f.source1);
        if (r && f.p1 !== r) { f.p1 = r; changed = true; }
      }
      if (f.source2) {
        const r = resolveSource(data, f.source2);
        if (r && f.p2 !== r) { f.p2 = r; changed = true; }
      }

      // Auto-resolve a bye once both sides are known-or-static.
      const s1ready = !f.source1 || resolveSource(data, f.source1) !== null;
      const s2ready = !f.source2 || resolveSource(data, f.source2) !== null;
      if (s1ready && s2ready) {
        if (f.p1 != null && f.p2 == null) { f.winnerId = f.p1; f.status = "done"; changed = true; }
        else if (f.p2 != null && f.p1 == null) { f.winnerId = f.p2; f.status = "done"; changed = true; }
      }
    }

    // Groups → knockout: build the knockout once every group game is done.
    if (data.format === "groups_knockout" && !data.knockoutGenerated) {
      const groupFx = data.fixtures.filter((f) => f.stage === "group");
      if (groupFx.length && groupFx.every((f) => f.status === "done")) {
        const adv = data.advancers || 2;
        const qualifiers = []; // [{id, group, place}]
        for (const g of Object.keys(data.groups)) {
          const st = fixtureStandings(
            groupFx.filter((f) => f.group === g),
            data.groups[g],
            seedRatings
          );
          st.slice(0, adv).forEach((r, place) => qualifiers.push({ id: r.id, group: g, place }));
        }
        // Cross-seed: 1st of each group vs a 2nd from another group.
        const firsts = qualifiers.filter((q) => q.place === 0).map((q) => q.id);
        const seconds = qualifiers.filter((q) => q.place === 1).map((q) => q.id);
        const koSeeds = [];
        for (let i = 0; i < firsts.length; i++) {
          koSeeds.push(firsts[i]);
          koSeeds.push(seconds[(i + 1) % seconds.length] ?? null);
        }
        const seeds = koSeeds.filter(Boolean);
        const startId = data.fixtures.length + 1000;
        const ko = genSingleElim(seeds, startId, "knockout");
        data.fixtures.push(...ko.fixtures);
        data.finalId = ko.finalId;
        data.knockoutGenerated = true;
        changed = true;
      }
    }

    // Duel: first to N game wins. Deal another game until someone gets there.
    if (data.format === "duel" && data.status !== "completed") {
      const target = data.duelTarget || 1;
      const [a, b] = data.playerIds;
      const done = data.fixtures.filter((f) => f.status === "done" && f.winnerId);
      const aw = done.filter((f) => f.winnerId === a).length;
      const bw = done.filter((f) => f.winnerId === b).length;
      if (aw >= target || bw >= target) {
        data.status = "completed";
        data.winnerId = aw >= bw ? a : b;
        changed = true;
      } else if (data.fixtures.every((f) => f.status === "done")) {
        const idc = (data.lastId || data.fixtures.length) + 1;
        data.fixtures.push(
          newFixture(idc, {
            round: data.fixtures.length,
            label: `Game ${data.fixtures.length + 1}`,
            p1: a,
            p2: b,
          })
        );
        data.lastId = idc;
        changed = true;
      }
    }

    // Swiss: generate the next round when the current one is finished.
    if (data.format === "swiss" && data.roundsGenerated < data.swissRounds) {
      const cur = data.roundsGenerated - 1;
      const curFx = data.fixtures.filter((f) => f.round === cur);
      if (curFx.length && curFx.every((f) => f.status === "done")) {
        const st = fixtureStandings(data.fixtures, data.playerIds, seedRatings);
        const played = new Set(
          data.fixtures
            .filter((f) => f.p1 && f.p2)
            .map((f) => [f.p1, f.p2].sort().join("|"))
        );
        const pool = st.map((r) => r.id);
        const byed = new Set(
          data.fixtures.filter((f) => f.p2 == null).map((f) => f.p1)
        );
        const next = [];
        let idc = (data.lastId || data.fixtures.length) + 1;
        const used = new Set();

        for (let i = 0; i < pool.length; i++) {
          const a = pool[i];
          if (used.has(a)) continue;
          let partner = null;
          for (let j = i + 1; j < pool.length; j++) {
            const b = pool[j];
            if (used.has(b)) continue;
            if (!played.has([a, b].sort().join("|"))) { partner = b; break; }
          }
          // fall back to the next free player even if it's a rematch
          if (!partner) {
            for (let j = i + 1; j < pool.length; j++) {
              if (!used.has(pool[j])) { partner = pool[j]; break; }
            }
          }
          if (partner) {
            used.add(a); used.add(partner);
            next.push(
              newFixture(idc++, {
                round: data.roundsGenerated,
                label: `Round ${data.roundsGenerated + 1}`,
                p1: a,
                p2: partner,
              })
            );
          }
        }
        // leftover player gets a bye (prefer someone who hasn't had one)
        const leftover = pool.find((id) => !used.has(id));
        if (leftover != null) {
          next.push(
            newFixture(idc++, {
              round: data.roundsGenerated,
              label: `Round ${data.roundsGenerated + 1}`,
              p1: leftover,
              p2: null,
              winnerId: leftover,
              status: "done",
            })
          );
        }
        data.fixtures.push(...next);
        data.lastId = idc - 1;
        data.roundsGenerated += 1;
        changed = true;
      }
    }
  }

  // Completion + winner -------------------------------------------------
  const allDone = data.fixtures.length > 0 && data.fixtures.every((f) => f.status === "done");

  if (data.format === "single_elim" || data.format === "groups_knockout") {
    const final = data.finalId && fixtureById(data, data.finalId);
    if (final && final.status === "done" && final.winnerId) {
      data.status = "completed";
      data.winnerId = final.winnerId;
    }
  } else if (data.format === "duel") {
    // Completion is handled in the loop above (race to N wins).
  } else if (allDone) {
    const st = fixtureStandings(data.fixtures, data.playerIds, seedRatings);
    data.status = "completed";
    data.winnerId = st[0]?.id || null;
  }

  return data;
}

// Apply a played result to a fixture, then advance the bracket.
export function applyResult(data, fixtureId, score1, score2, seedRatings = null) {
  const f = data.fixtures.find((x) => x.id === fixtureId);
  if (!f) throw new Error("Fixture not found");
  f.score1 = score1;
  f.score2 = score2;
  f.winnerId = score1 > score2 ? f.p1 : f.p2;
  f.status = "done";
  return advance(data, seedRatings);
}

// The fixtures that are ready to play right now (both players known, pending).
export function playableFixtures(data) {
  return data.fixtures.filter(
    (f) => f.status === "pending" && f.p1 != null && f.p2 != null
  );
}
