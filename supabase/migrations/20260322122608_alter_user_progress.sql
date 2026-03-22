-- puzzle_id is nullable until curated puzzles with unique ids are introduced
alter table public.user_progress
  alter column puzzle_id drop not null;

-- index for stats and leaderboard queries that filter or group by user and difficulty
create index user_progress_user_difficulty_idx
  on public.user_progress (user_id, difficulty);
