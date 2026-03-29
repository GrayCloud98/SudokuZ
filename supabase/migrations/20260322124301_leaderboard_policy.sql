-- allows anyone (including guests) to read user_progress for leaderboard queries
create policy "anyone can view progress for leaderboard"
  on public.user_progress
  for select
  using (true);
