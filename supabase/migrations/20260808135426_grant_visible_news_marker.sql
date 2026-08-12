grant select (hidden_at) on table public.news to anon, authenticated;

comment on column public.news.hidden_at is 'Public roles may read this marker only on rows already allowed by RLS; visible rows always expose null.';
