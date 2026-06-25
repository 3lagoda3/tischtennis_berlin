// Pure helpers — compute the leaderboard, form, and head-to-head from raw rows.
import { computeElo } from "./elo";

// Map playerId -> array of tournament names they won (completed tournaments).
export function winnerTitles(tournaments = []) {
  const map = new Map();
  for (const t of tournaments) {
    if (t.status === "completed" && t.winner_id) {
      const list = map.get(t.winner_id) || [];
      list.push(t.name);
      map.set(t.winner_id, list);
    }
  }
  return map;
}

// Build a per-player stats table from players + matches.
// Ranked by Elo rating. Also attaches recent form (last 5, newest first),
// current streak (positive = win streak, negative = loss streak), and any
// tournament titles.
export function buildStandings(players, matches, tournaments = []) {
  const { rating } = computeElo(players, matches);
  const titles = winnerTitles(tournaments);
  const stats = new Map();
  for (const p of players) {
    stats.set(p.id, {
      ...p,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      results: [], // chronological "W" / "L"
    });
  }

  // Oldest → newest so form/streak read in real order.
  const chrono = [...matches].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  for (const m of chrono) {
    const a = stats.get(m.player1_id);
    const b = stats.get(m.player2_id);
    if (!a || !b) continue; // player was deleted

    a.played++; b.played++;
    a.pointsFor += m.score1; a.pointsAgainst += m.score2;
    b.pointsFor += m.score2; b.pointsAgainst += m.score1;

    if (m.winner_id === a.id) { a.won++; b.lost++; a.results.push("W"); b.results.push("L"); }
    else if (m.winner_id === b.id) { b.won++; a.lost++; b.results.push("W"); a.results.push("L"); }
  }

  const rows = [...stats.values()].map((s) => {
    // streak: consecutive identical results counted from the end
    let streak = 0;
    let type = null;
    for (let i = s.results.length - 1; i >= 0; i--) {
      if (type === null) { type = s.results[i]; streak = 1; }
      else if (s.results[i] === type) streak++;
      else break;
    }
    const elo = rating.get(s.id) ?? 1000;
    return {
      ...s,
      elo,
      eloRounded: Math.round(elo),
      winRate: s.played ? s.won / s.played : 0,
      diff: s.pointsFor - s.pointsAgainst,
      last5: s.results.slice(-5).reverse(), // newest first
      streak: type ? (type === "W" ? streak : -streak) : 0,
      titles: titles.get(s.id) || [],
    };
  });

  // Rank by Elo; players with no games sink below those who've played.
  rows.sort(
    (x, y) =>
      (y.played > 0) - (x.played > 0) ||
      y.elo - x.elo ||
      y.winRate - x.winRate ||
      x.nickname.localeCompare(y.nickname)
  );

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// All matches between two specific players, newest first, with a summary.
export function headToHead(matches, id1, id2) {
  const games = matches
    .filter(
      (m) =>
        (m.player1_id === id1 && m.player2_id === id2) ||
        (m.player1_id === id2 && m.player2_id === id1)
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let wins1 = 0;
  let wins2 = 0;
  for (const m of games) {
    if (m.winner_id === id1) wins1++;
    else if (m.winner_id === id2) wins2++;
  }

  return { games, wins1, wins2 };
}

// Everything needed for a single player's profile page.
export function playerProfile(players, matches, id) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));

  const games = matches
    .filter((m) => m.player1_id === id || m.player2_id === id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((m) => {
      const isP1 = m.player1_id === id;
      const oppId = isP1 ? m.player2_id : m.player1_id;
      return {
        id: m.id,
        created_at: m.created_at,
        my: isP1 ? m.score1 : m.score2,
        opp: isP1 ? m.score2 : m.score1,
        oppId,
        opponent: byId[oppId],
        won: m.winner_id === id,
        draw: !m.winner_id,
        raw: m,
      };
    });

  // Per-opponent record (only opponents that still exist).
  const map = new Map();
  for (const g of games) {
    if (!g.opponent) continue;
    const o = map.get(g.oppId) || { opponent: g.opponent, won: 0, lost: 0 };
    if (g.won) o.won++;
    else if (!g.draw) o.lost++;
    map.set(g.oppId, o);
  }
  const opponents = [...map.values()].map((o) => ({
    ...o,
    played: o.won + o.lost,
    rate: o.won + o.lost ? o.won / (o.won + o.lost) : 0,
  }));

  // nemesis = most losses to; bunny = most wins against
  const nemesis = [...opponents].sort((a, b) => b.lost - a.lost || a.won - b.won)[0];
  const bunny = [...opponents].sort((a, b) => b.won - a.won || a.lost - b.lost)[0];

  return {
    games,
    opponents,
    nemesis: nemesis && nemesis.lost > 0 ? nemesis : null,
    bunny: bunny && bunny.won > 0 ? bunny : null,
  };
}

export function winnerOf(score1, score2, id1, id2) {
  if (score1 === score2) return null;
  return score1 > score2 ? id1 : id2;
}
