create index if not exists news_source_id_idx
  on public.news (source_id)
  where source_id is not null;

create index if not exists raw_items_source_id_idx
  on public.raw_items (source_id)
  where source_id is not null;

comment on index public.news_source_id_idx is 'Supports source deletion checks and source-scoped news operations.';
comment on index public.raw_items_source_id_idx is 'Supports source deletion checks and source-scoped raw item operations.';
