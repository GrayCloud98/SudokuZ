create table public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  puzzle_id text not null,
  difficulty text not null,
  completed_at timestamptz default now() not null,
  time_seconds integer not null
);

alter table public.user_progress enable row level security;

create policy "users can view their own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "users can insert their own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);