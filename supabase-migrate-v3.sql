-- =============================================================
--  Berlin Pong — v3 migration (Elo needs no schema; this adds
--  tournaments, newsletter subscribers, and the photo gallery).
--  Run the whole file once in: Supabase → SQL Editor → New query → Run.
--  Safe to re-run (idempotent).
-- =============================================================

-- Tournaments --------------------------------------------------
create table if not exists tournaments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  format     text not null,                 -- round_robin | single_elim | groups_knockout | swiss
  status     text not null default 'active',-- active | completed
  winner_id  uuid references players(id) on delete set null,
  data       jsonb not null default '{}',   -- fixtures, seeds, groups, settings
  created_at timestamptz not null default now()
);

-- Tag matches with the tournament they belong to (null = casual game).
alter table matches add column if not exists tournament_id uuid
  references tournaments(id) on delete set null;

-- Newsletter subscribers --------------------------------------
create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Photo gallery -----------------------------------------------
create table if not exists gallery (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);
create index if not exists gallery_created_at_idx on gallery (created_at desc);

-- Row Level Security (open at the DB level; the app gates editing
-- behind the admin password in the UI) -----------------------
alter table tournaments enable row level security;
alter table subscribers enable row level security;
alter table gallery     enable row level security;

drop policy if exists "tournaments_all" on tournaments;
create policy "tournaments_all" on tournaments for all using (true) with check (true);

drop policy if exists "subscribers_all" on subscribers;
create policy "subscribers_all" on subscribers for all using (true) with check (true);

drop policy if exists "gallery_all" on gallery;
create policy "gallery_all" on gallery for all using (true) with check (true);

-- Live updates -------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table tournaments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table gallery;     exception when duplicate_object then null; end;
end $$;

-- Gallery storage bucket --------------------------------------
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "gallery_read" on storage.objects;
create policy "gallery_read" on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists "gallery_write" on storage.objects;
create policy "gallery_write" on storage.objects
  for insert with check (bucket_id = 'gallery');
