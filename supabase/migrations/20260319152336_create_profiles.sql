create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'avatar_url',
    'user_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  );
  return new;
end;
$$ language plpgsql security definer set;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
