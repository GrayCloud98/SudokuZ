-- replace is_complete boolean with a proper status field
alter table public.roadmap_items
  drop column is_complete;

alter table public.roadmap_items
  add column status text not null default 'todo'
  check (status in ('todo', 'in_progress', 'done', 'parked'));
