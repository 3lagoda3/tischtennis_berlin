// Pure helpers — compute the leaderboard and head-to-head from raw rows.

// Build a per-player stats table from players + matches.
// Points = 1 per win. Sorted by points, then win%, then fewer losses.
export function buildStandings(players, matches) {
  const stats = new Map();
  for (const p of players) {
    stats.set(p.id, {
      ...p,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  for (const m of matches) {
    const a = stats.get(m.player1_id);
    const b = stats.get(m.player2_id);
    if (!a || !b) continue; // player was deleted

    a.played++; b.played++;
    a.pointsFor += m.score1; a.pointsAgainst += m.score2;
    b.pointsFor += m.score2; b.pointsAgainst += m.score1;

    if (m.winner_id === a.id) { a.won++; b.lost++; }
    else if (m.winner_id === b.id) { b.won++; a.lost++; }
  }

  const rows = [...stats.values()].map((s) => ({
    ...s,
    points: s.won, // 1 point per win
    winRate: s.played ? s.won / s.played : 0,
    diff: s.pointsFor - s.pointsAgainst,
  }));

  rows.sort(
    (x, y) =>
      y.points - x.points ||
      y.winRate - x.winRate ||
      y.diff - x.diff ||
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

export function winnerOf(score1, score2, id1, id2) {
  if (score1 === score2) return null;
  return score1 > score2 ? id1 : id2;
}
