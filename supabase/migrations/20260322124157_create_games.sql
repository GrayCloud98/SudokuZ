-- stores one in-progress game per user, upserted on each auto-save
create table public.games (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  puzzle jsonb not null,
  solution jsonb not null,
  board jsonb not null,
  difficulty text not null,
  elapsed_seconds integer not null default 0,
  saved_at timestamptz default now() not null
);

alter table public.games enable row level security;

create policy "users can view their own game"
  on public.games
  for select
  using (auth.uid() = user_id);

create policy "users can upsert their own game"
  on public.games
  for insert
  with check (auth.uid() = user_id);

create policy "users can update their own game"
  on public.games
  for update
  using (auth.uid() = user_id);

create policy "users can delete their own game"
  on public.games
  for delete
  using (auth.uid() = user_id);
