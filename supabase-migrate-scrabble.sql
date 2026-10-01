-- Online Scrabble rooms. Run once in Supabase → SQL Editor.
-- Same open-access model as the other tables (friends only; the UI hides the opponent's rack).

create table if not exists public.scrabble_games (
  code        text primary key,
  state       jsonb not null,
  version     int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.scrabble_games enable row level security;

drop policy if exists "scrabble open" on public.scrabble_games;
create policy "scrabble open" on public.scrabble_games
  for all using (true) with check (true);

-- Live updates
do $$
begin
  begin alter publication supabase_realtime add table scrabble_games; exception when duplicate_object then null; end;
end $$;
alter table public.scrabble_games replica identity full;
