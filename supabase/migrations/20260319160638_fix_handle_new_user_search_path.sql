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
$$ language plpgsql security definer set search_path = public;