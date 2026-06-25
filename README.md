# 🏓 Berlin Pong

A minimalist table-tennis leaderboard for your crew. Add players (with a photo),
log games, and the table updates **live** on everyone's screen. Built with Next.js +
Supabase, deploys free on Vercel.

- **Elo leaderboard** — chess-style ratings (start 1000, K=32) so beating stronger players matters; plus games / won / lost, win %, **form** + **streaks**.
- **Tournaments** — round-robin, single-elim, groups→knockout, or Swiss. Pick players, the app builds the schedule and tells you who's up next; the winner gets a 🏆 badge.
- **Podium** — top-3 on a podium, tap any player for their profile.
- **Player profiles** — Elo, win %, point diff, form, favourite victim & nemesis, and **head2head** vs every opponent.
- **Edit / delete** — admins fix wrong scores or remove players; games clean up automatically.
- **Recent games feed** — the latest results, live.
- **Dark / light mode** — toggle in the header, remembers your choice.
- **Gallery** — admins upload photos from game nights.
- **Newsletter** — collect emails for tournament announcements.
- **Live** — changes sync to every open browser instantly.
- **Admin login** — viewing is open; all editing is behind an admin password (see below).

---

## Setup (≈ 10 minutes, all free)

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is plenty).
2. Pick a name + database password, region **Frankfurt** (closest to Berlin). Wait ~2 min.

### 2. Create the database tables
1. In Supabase, open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase-schema.sql`](./supabase-schema.sql) and click **Run**.
   - This creates the `players` + `matches` tables, opens access, enables live updates,
     and creates the public **`avatars`** storage bucket for photos.

### 3. Grab your two keys
- Supabase → **Project Settings → API**. Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Deploy on Vercel
1. Push this folder to GitHub (see below).
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Before deploying, add the two **Environment Variables** from step 3.
4. **Deploy.** Done — share the URL with your friends.

> If you open the site and see a "connect Supabase" screen, the env vars are missing
> or misspelled. Add them under Vercel → Project → Settings → Environment Variables,
> then redeploy.

---

## Run locally (optional)

```bash
cp .env.local.example .env.local   # then paste your two keys into it
npm install
npm run dev                        # http://localhost:3000
```

---

## Push to GitHub

```bash
git init
git add -A
git commit -m "Berlin Pong"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## Upgrading an existing deployment (v3)

If you already deployed an earlier version, run the new migration once:
**Supabase → SQL Editor → New query →** paste [`supabase-migrate-v3.sql`](./supabase-migrate-v3.sql)
→ **Run**. (Fresh installs: run `supabase-schema.sql` first, then the migration.)
It adds the `tournaments`, `subscribers`, and `gallery` tables + the gallery photo bucket.
Elo needs no schema change — it's computed from match history.

## Admin password (editing)

Viewing is always open. **All editing** — players, games, tournaments, gallery —
is behind an **Admin login** (🔒 chip in the header). Set the password on Vercel
(Project → Settings → Environment Variables) and redeploy:

| Key | Value |
|---|---|
| `ADMIN_PASSWORD` | your admin password |

If you don't set it, it defaults to `pinqponq` so the app works immediately.
⚠️ This is a UI gate (it hides the controls), not hard security — set your own
`ADMIN_PASSWORD` and don't treat it as bulletproof. For real lockdown, move writes
behind Supabase Auth + RLS.

## Notes
- The login is remembered per device (localStorage), so the organiser stays logged in.
- Tournament games count toward Elo just like casual games.
- **Scoring** is one row per game. Want best-of-X matches or an Elo rating instead?
  It's a small change in `lib/standings.js`.
- **Colors** live in `tailwind.config.js` (`ink`, `paper`, `ball`). Two colours, monochrome rest.
