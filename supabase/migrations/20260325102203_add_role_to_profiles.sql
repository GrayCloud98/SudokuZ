-- role column for access control, defaults to 'user' for all existing and new accounts
alter table public.profiles
  add column role text not null default 'user';
