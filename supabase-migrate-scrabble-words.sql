-- "Наші слова": words friends accepted in Scrabble (dialect, slang…). Run once in Supabase → SQL Editor.
-- Same open-access model as the other tables.

create table if not exists public.scrabble_words (
  lang        text not null,
  word        text not null,
  region      text,
  added_by    text,
  created_at  timestamptz not null default now(),
  primary key (lang, word)
);

alter table public.scrabble_words enable row level security;

drop policy if exists "scrabble words open" on public.scrabble_words;
create policy "scrabble words open" on public.scrabble_words
  for all using (true) with check (true);
