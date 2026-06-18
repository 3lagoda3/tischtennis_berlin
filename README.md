# 🏓 Berlin Pong

A minimalist table-tennis leaderboard for your crew. Add players (with a photo),
log games, and the table updates **live** on everyone's screen. Built with Next.js +
Supabase, deploys free on Vercel.

- **Leaderboard** — games played / won / lost, win %, and **1 point per win**.
- **Log a game** — pick two players from a dropdown, enter the score, winner is automatic.
- **Head to head** — pick any two players, see your full match history.
- **Add player** — nickname + take/upload a photo straight from your phone.
- **Live** — changes sync to every open browser instantly.

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

## Notes
- **Access** is open: anyone with the link can add players and log games — fine for a
  private group. To lock it down later, tighten the RLS policies in `supabase-schema.sql`.
- **Scoring** is one row per game. Want best-of-X matches or an Elo rating instead?
  It's a small change in `lib/standings.js`.
- **Colors** live in `tailwind.config.js` (`ink`, `paper`, `ball`). Two colours, monochrome rest.
