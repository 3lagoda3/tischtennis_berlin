// Berlin Pong version history. Newest first.
// Add a new entry at the TOP every time the site changes.
export const CHANGELOG = [
  {
    version: "v1.3",
    date: "2026-06-29",
    title: "Smoother & more open",
    changes: [
      "New 1-v-1 Duel format: just two of you? Pick a target (first to 10, 15, whatever) and the app keeps dealing games until someone gets there. Counts toward Elo.",
      "Each tournament format now has its own trippy animated winner's badge — Duelist, League Champ, Knockout King, Cup Winner and Swiss Master — a liquid-marble medallion that flows next to your name and big on the champion card.",
      "New player? Cue the celebration 🎉 — a racket, a flying ball, and a little party greet every new member.",
      "Adding players and logging games is now open to everyone — no password needed.",
      "The admin password now only protects editing scores and deleting players/games.",
      "Fixed photo uploads failing on some phones.",
    ],
  },
  {
    version: "v1.2",
    date: "2026-06-26",
    title: "Polish",
    changes: [
      "Added the orange-ball icon to browser tabs and bookmarks.",
      "Fixed mobile: the Add player / Log a game bar is now always reachable (taps prompt admin login).",
    ],
  },
  {
    version: "v1.1",
    date: "2026-06-25",
    title: "The big summer update",
    changes: [
      "Switched ranking to chess-style Elo — beating stronger players is worth more.",
      "Tournaments: round-robin, single elimination, groups→knockout, or Swiss. Pick players, the app builds the schedule and tells you who's up next, and winners get a badge.",
      "Edit or delete players and games to fix wrong scores, behind a light admin password.",
      "Player profiles: form, win streaks, favourite victim & nemesis, full match history, and your record vs every opponent.",
      "Top-3 podium above the table, plus a recent games feed.",
      "Dark / light mode toggle in the header.",
      "Newsletter signup and a photo gallery — tap any photo for a fullscreen, swipeable viewer.",
      "Added this changelog at the bottom of the page.",
      "Moved to our own home at berlin-pong.com on Cloudflare's global network, upgraded under the hood (Next.js 15 + React 19).",
    ],
  },
  {
    version: "v1",
    date: "2026-06-17",
    title: "Launch 🏓",
    changes: [
      "Berlin Pong goes live: the shared leaderboard for the crew.",
      "Add players with a photo, log games, winner detected automatically.",
      "1 point per win, games played / won / lost, win %.",
      "Head-to-head between any two players.",
      "Everything syncs live across everyone's phones.",
    ],
  },
];
