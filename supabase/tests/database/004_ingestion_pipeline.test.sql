begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

select has_table('public', 'ingestion_runs', 'ingestion runs table exists');
select has_table('public', 'raw_items', 'raw items table exists');
select has_view('public', 'source_health_status', 'source health view exists');

select has_column('public', 'raw_items', 'content_hash', 'raw items keep a stable content hash');
select has_column('public', 'raw_items', 'normalized_url', 'raw items keep a normalized URL');
select has_column('public', 'raw_items', 'processing_status', 'raw items keep processing status');
select has_column('public', 'raw_items', 'is_simulated', 'raw items explicitly identify simulation data');
select has_column('public', 'raw_items', 'raw_payload', 'raw items preserve structured source payload');

select has_column('public', 'ingestion_runs', 'idempotency_key', 'runs have idempotency keys');
select has_column('public', 'ingestion_runs', 'attempt', 'runs record retry attempts');
select has_column('public', 'ingestion_runs', 'error_code', 'runs record stable error codes');
select has_column('public', 'ingestion_runs', 'is_simulated', 'runs distinguish simulation from real collection');
select has_column('public', 'ingestion_runs', 'inserted_count', 'runs record inserted counts');

select has_column('public', 'news', 'raw_item_id', 'news can trace back to the raw item');
select has_column('public', 'news', 'source_id', 'news can trace back to the registered source');
select has_column('public', 'news', 'is_simulated', 'news explicitly identifies simulation data');

select results_eq(
  $$
    select count(*)::bigint
    from pg_class
    where oid in ('public.ingestion_runs'::regclass, 'public.raw_items'::regclass)
      and relrowsecurity
  $$,
  $$ values (2::bigint) $$,
  'RLS is enabled on both internal ingestion tables'
);

select ok(not has_table_privilege('anon', 'public.ingestion_runs', 'select'), 'anonymous clients cannot read ingestion runs');
select ok(not has_table_privilege('authenticated', 'public.raw_items', 'select'), 'authenticated clients cannot read raw payloads');
select ok(has_table_privilege('service_role', 'public.ingestion_runs', 'insert'), 'service role can create runs');
select ok(has_table_privilege('service_role', 'public.raw_items', 'insert'), 'service role can create raw items');

select has_index('public', 'ingestion_runs', 'ingestion_runs_source_created_idx', 'source run history is indexed');
select has_index('public', 'ingestion_runs', 'ingestion_runs_status_created_idx', 'run status is indexed');
select has_index('public', 'raw_items', 'raw_items_content_hash_idx', 'content hash lookup is indexed');
select has_index('public', 'raw_items', 'raw_items_pending_idx', 'pending work has a partial index');
select has_index('public', 'news', 'news_source_id_idx', 'news source foreign key is indexed');
select has_index('public', 'raw_items', 'raw_items_source_id_idx', 'raw source foreign key is indexed');

select results_eq(
  $$ select count(*)::bigint from public.sources where collection_enabled $$,
  $$ values (0::bigint) $$,
  'no real source is enabled after the ingestion migration'
);

select throws_ok(
  $$
    insert into public.ingestion_runs (
      source_id, source_key, adapter_kind, idempotency_key, is_simulated
    ) values (
      '30000000-0000-4000-8000-000000000006',
      'manchester-united-official',
      'approved_feed',
      'blocked-real-source',
      false
    )
  $$,
  'P0001',
  'source is not approved for automated collection',
  'database rejects an unapproved real source before collection'
);

select lives_ok(
  $$
    insert into public.ingestion_runs (
      source_id, source_key, adapter_kind, trigger_type, idempotency_key, is_simulated, status
    ) values (
      null, '0126-synthetic-feed', 'mock', 'preview', 'simulation-day25', true, 'running'
    )
  $$,
  'explicit simulation run is accepted without impersonating a source'
);

select throws_ok(
  $$
    insert into public.ingestion_runs (
      source_id, source_key, adapter_kind, trigger_type, idempotency_key, is_simulated
    ) values (
      null, '0126-synthetic-feed', 'mock', 'preview', 'simulation-day25', true
    )
  $$,
  '23505',
  null,
  'run idempotency key rejects duplicate batches'
);

insert into public.raw_items (
  ingestion_run_id, source_id, source_key, external_id, original_url, normalized_url,
  title, published_at, content_hash, is_simulated
)
select id, null, '0126-synthetic-feed', 'fixture-1', 'https://example.invalid/fixture-1',
  'https://example.invalid/fixture-1', 'simulation fixture', '2026-08-08T00:00:00Z',
  repeat('a', 64), true
from public.ingestion_runs
where idempotency_key = 'simulation-day25';

select throws_ok(
  $$
    insert into public.raw_items (
      ingestion_run_id, source_id, source_key, external_id, original_url, normalized_url,
      title, published_at, content_hash, is_simulated
    )
    select id, null, '0126-synthetic-feed', 'fixture-1', 'https://example.invalid/fixture-duplicate',
      'https://example.invalid/fixture-duplicate', 'duplicate fixture', '2026-08-08T00:00:00Z',
      repeat('b', 64), true
    from public.ingestion_runs
    where idempotency_key = 'simulation-day25'
  $$,
  '23505',
  null,
  'source and external ID reject duplicate raw items'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.sources
    where source_type = 'club_official'
      and operational_classification = 'manual_only'
      and not collection_enabled
  $$,
  $$ values (14::bigint) $$,
  'all fourteen club sources remain manual-only and disabled'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_class
    where oid = 'public.source_health_status'::regclass
      and reloptions @> array['security_invoker=true']
  $$,
  $$ values (1::bigint) $$,
  'source health view uses invoker security'
);

select ok(
  not has_function_privilege('anon', 'private.enforce_ingestion_source_gate()', 'execute'),
  'anonymous role cannot call the internal source gate function'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.source_health_status
    where operational_classification = 'manual_only'
      and health_state = 'disabled'
  $$,
  $$ values (19::bigint) $$,
  'reviewed but unapproved sources are reported as disabled, not healthy'
);

select * from finish();

rollback;
