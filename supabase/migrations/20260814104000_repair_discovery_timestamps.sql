begin;

update public.raw_items
set published_at = created_at
where not is_simulated
  and published_at < timestamptz '2000-01-01 00:00:00+00';

update public.news
set published_at = created_at
where not is_simulated
  and published_at < timestamptz '2000-01-01 00:00:00+00';

commit;
