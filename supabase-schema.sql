-- =============================================================
--  Berlin Pong — Supabase schema
--  Run this whole file in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================

-- Players ------------------------------------------------------
create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  nickname   text not null,
  photo_url  text,
  created_at timestamptz not null default now()
);

-- Matches (one game per row, e.g. 11-9) ------------------------
create table if not exists matches (
  id         uuid primary key default gen_random_uuid(),
  player1_id uuid not null references players(id) on delete cascade,
  player2_id uuid not null references players(id) on delete cascade,
  score1     int  not null check (score1 >= 0),
  score2     int  not null check (score2 >= 0),
  winner_id  uuid references players(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists matches_created_at_idx on matches (created_at desc);

-- Row Level Security ------------------------------------------
-- Open access: anyone with the anon key (i.e. anyone with the link) can
-- read and write. Fine for a private friend group. Lock down later if needed.
alter table players enable row level security;
alter table matches enable row level security;

drop policy if exists "players_all" on players;
create policy "players_all" on players for all using (true) with check (true);

drop policy if exists "matches_all" on matches;
create policy "matches_all" on matches for all using (true) with check (true);

-- Realtime: push live changes to every open browser ------------
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table matches;

-- =============================================================
--  Storage bucket for profile photos
--  Easiest: Dashboard → Storage → New bucket → name "avatars" → Public.
--  Or run the lines below.
-- =============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_write" on storage.objects;
create policy "avatars_write" on storage.objects
  for insert with check (bucket_id = 'avatars');
