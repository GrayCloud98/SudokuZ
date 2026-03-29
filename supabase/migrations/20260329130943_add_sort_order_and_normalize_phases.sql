alter table public.roadmap_items
  add column sort_order integer;

with ranked_items as (
  select
    id,
    row_number() over (
      partition by coalesce(phase, 'uncategorized')
      order by created_at asc, id asc
    ) - 1 as new_sort_order
  from public.roadmap_items
)
update public.roadmap_items ri
set sort_order = ranked_items.new_sort_order
from ranked_items
where ri.id = ranked_items.id;

alter table public.roadmap_items
  alter column sort_order set not null;

alter table public.roadmap_items
  alter column sort_order set default 0;

update public.roadmap_items
set phase = regexp_replace(phase, '^Phase\s+(\d+)\s*·\s*', 'Phase \1 - ')
where phase ~ '^Phase\s+\d+\s*·\s*';
