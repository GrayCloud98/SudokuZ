-- stores admin-managed roadmap items for the secret admin screen
create table public.roadmap_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  phase text,
  is_complete boolean not null default false,
  created_at timestamptz default now() not null
);

alter table public.roadmap_items enable row level security;

-- only admins can do anything with roadmap items
create policy "admins can do everything with roadmap items"
  on public.roadmap_items
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
