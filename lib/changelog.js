// Berlin Pong version history. Newest first.
// Add a new entry at the TOP every time the site changes.
export const CHANGELOG = [
  {
    version: "v1.7",
    date: "2026-06-29",
    title: "Easier scoring",
    changes: [
      "Adding players and logging games no longer needs the admin password — just use the buttons.",
      "The password now only protects editing scores and deleting players/games.",
    ],
  },
  {
    version: "v1.6",
    date: "2026-06-29",
    title: "Bug fix",
    changes: [
      "Fixed adding a player with a photo on some phones — uploads no longer error out.",
    ],
  },
  {
    version: "v1.5",
    date: "2026-06-26",
    title: "Polish",
    changes: [
      "Added the orange-ball icon to browser tabs and bookmarks.",
      "Fixed mobile: the Add player / Log a game bar is now always reachable (taps prompt admin login).",
    ],
  },
  {
    version: "v1.4",
    date: "2026-06-25",
    title: "Our own home",
    changes: [
      "Berlin Pong now lives at berlin-pong.com 🎉",
      "Moved hosting to Cloudflare's global network for snappier loads worldwide.",
      "Upgraded the engine under the hood (Next.js 15 + React 19).",
    ],
  },
  {
    version: "v1.3",
    date: "2026-06-25",
    title: "Photo viewer & this changelog",
    changes: [
      "Tap any gallery photo to open it fullscreen.",
      "Swipe left/right (or use the arrows / keyboard) to browse all photos.",
      "Added this changelog at the bottom of the page.",
      "Fixed photo uploads on mobile — you can now pick from your library, not just the camera.",
    ],
  },
  {
    version: "v1.2",
    date: "2026-06-25",
    title: "Elo & tournaments",
    changes: [
      "Switched ranking to chess-style Elo — beating stronger players is worth more.",
      "Tournaments: round-robin, single elimination, groups→knockout, or Swiss. Pick players, the app builds the schedule and tells you who's up next.",
      "Tournament winners get a 🏆 badge next to their name.",
      "Admin login — viewing stays open, but editing is now behind a password.",
      "Dark / light mode toggle in the header.",
      "head2head moved into player profiles (record vs every opponent).",
      "Newsletter signup and a photo gallery.",
    ],
  },
  {
    version: "v1.1",
    date: "2026-06-25",
    title: "Editing & profiles",
    changes: [
      "Edit or delete players and games (fix wrong scores).",
      "Player profiles: form, win streaks, favourite victim & nemesis, full match history.",
      "Top-3 podium above the table.",
      "Recent games feed.",
      "Light password protection for editing.",
    ],
  },
  {
    version: "v1.0",
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
