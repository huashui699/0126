begin;

create extension if not exists pgtap with schema extensions;

select plan(35);

select has_table('public', 'event_clusters', 'event_clusters table exists');
select has_table('public', 'cluster_items', 'cluster_items table exists');
select has_table('public', 'news_teams', 'news_teams table exists');

select has_column('public', 'news', 'published_at', 'news has published_at');
select has_column('public', 'news', 'event_at', 'news has optional event_at');
select has_column('public', 'news', 'info_type', 'news has information type');
select has_column('public', 'news', 'trust_status', 'news has display trust status');
select has_column('public', 'news', 'trust_reason', 'news has explainable trust reason');
select has_column('public', 'cluster_items', 'is_primary', 'cluster membership identifies the primary report');
select has_column('public', 'news_teams', 'relationship', 'team relationship type is recorded');

select results_eq(
  $$
    select count(*)::bigint
    from pg_class
    where oid in (
      'public.event_clusters'::regclass,
      'public.cluster_items'::regclass,
      'public.news_teams'::regclass
    ) and relrowsecurity
  $$,
  $$ values (3::bigint) $$,
  'RLS is enabled on every M3 public table'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'event_clusters' $$,
  $$ values (1::bigint) $$,
  'event clusters have one public-read policy'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'cluster_items' $$,
  $$ values (1::bigint) $$,
  'cluster items have one public-read policy'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'news_teams' $$,
  $$ values (1::bigint) $$,
  'news teams have one public-read policy'
);

select ok(has_table_privilege('anon', 'public.event_clusters', 'select'), 'anonymous clients can read event clusters subject to RLS');
select ok(has_table_privilege('authenticated', 'public.news_teams', 'select'), 'authenticated clients can read team relationships subject to RLS');
select ok(not has_table_privilege('anon', 'public.news_teams', 'insert'), 'anonymous clients cannot create team relationships');
select ok(not has_table_privilege('anon', 'public.news', 'update'), 'anonymous clients cannot change news trust state');

select has_index('public', 'news', 'news_published_at_idx', 'publication time is indexed');
select has_index('public', 'news', 'news_event_at_idx', 'event time is indexed');
select has_index('public', 'news', 'news_info_type_published_at_idx', 'information type filtering is indexed');
select has_index('public', 'news', 'news_trust_status_published_at_idx', 'trust filtering is indexed');
select has_index('public', 'event_clusters', 'event_clusters_event_at_idx', 'cluster event time is indexed');
select has_index('public', 'cluster_items', 'cluster_items_news_id_idx', 'cluster news lookup is indexed');
select has_index('public', 'news_teams', 'news_teams_team_id_news_id_idx', 'team calendar lookup is indexed');

select results_eq(
  $$ select count(*)::bigint from public.news where id::text like '50000000-0000-4000-8000-%' $$,
  $$ values (8::bigint) $$,
  'seed contains eight deterministic M3 calendar fixtures'
);

select results_eq(
  $$ select count(*)::bigint from public.news_teams where news_id::text like '50000000-0000-4000-8000-%' $$,
  $$ values (8::bigint) $$,
  'every M3 fixture has a stable team relationship'
);

select results_eq(
  $$ select count(*)::bigint from public.cluster_items where cluster_id = '60000000-0000-4000-8000-000000000001' $$,
  $$ values (2::bigint) $$,
  'sample event cluster contains two reports'
);

select results_eq(
  $$ select count(*)::bigint from public.news where published_at is null $$,
  $$ values (0::bigint) $$,
  'all legacy and new rows have a publication timestamp'
);

select results_eq(
  $$ select (published_at at time zone 'Asia/Shanghai')::date from public.news where id = '50000000-0000-4000-8000-000000000001' $$,
  $$ values ('2026-08-08'::date) $$,
  'UTC publication time resolves to the expected Shanghai calendar date'
);

select results_eq(
  $$ select (event_at at time zone 'Asia/Shanghai')::date from public.news where id = '50000000-0000-4000-8000-000000000005' $$,
  $$ values ('2026-08-10'::date) $$,
  'explicit event time resolves independently from publication time'
);

select throws_ok(
  $$ insert into public.news (title, info_type) values ('invalid type', 'unknown') $$,
  '23514',
  null,
  'unknown information types are rejected'
);

select throws_ok(
  $$
    insert into public.news_teams (news_id, team_id, relationship)
    values (
      '50000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'owner'
    )
  $$,
  '23514',
  null,
  'unknown team relationship types are rejected'
);

select results_eq(
  $$ select count(*)::bigint from public.news where id::text like '50000000-0000-4000-8000-%' and trust_status = 'rumor' $$,
  $$ values (0::bigint) $$,
  'M3 fixtures do not introduce low-trust community rumors'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'cluster_items'
      and indexname = 'cluster_items_one_primary_per_cluster_idx'
      and indexdef ilike '%unique%'
  $$,
  $$ values (1::bigint) $$,
  'each cluster can have at most one primary report'
);

select * from finish();

rollback;

