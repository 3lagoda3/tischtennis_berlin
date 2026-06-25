// Chess-style Elo. Ratings are derived from match history by replaying every
// played game in chronological order, so edits/deletes stay consistent.

export const ELO_START = 1000;
export const ELO_K = 32;

function expected(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

// Returns { rating: Map<id, number>, history: Map<id, number[]> }.
// history[id] is the player's rating after each of their games (for sparklines).
export function computeElo(players, matches, { start = ELO_START, k = ELO_K } = {}) {
  const rating = new Map(players.map((p) => [p.id, start]));
  const history = new Map(players.map((p) => [p.id, [start]]));

  const played = matches
    .filter((m) => m.winner_id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  for (const m of played) {
    if (!rating.has(m.player1_id) || !rating.has(m.player2_id)) continue;
    const ra = rating.get(m.player1_id);
    const rb = rating.get(m.player2_id);
    const ea = expected(ra, rb);
    const sa = m.winner_id === m.player1_id ? 1 : 0;

    const na = ra + k * (sa - ea);
    const nb = rb + k * (1 - sa - (1 - ea));
    rating.set(m.player1_id, na);
    rating.set(m.player2_id, nb);
    history.get(m.player1_id).push(na);
    history.get(m.player2_id).push(nb);
  }

  return { rating, history };
}
