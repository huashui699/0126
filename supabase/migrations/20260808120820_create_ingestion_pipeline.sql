alter table public.sources
  add column if not exists operational_classification text not null default 'pending_review'
    check (operational_classification in ('approved_adapter', 'pending_review', 'manual_only', 'blocked')),
  add column if not exists review_evidence_url text,
  add column if not exists last_successful_run_at timestamptz;

update public.sources
set operational_classification = case
  when access_status in ('approved_feed', 'approved_api') and collection_enabled then 'approved_adapter'
  when access_status = 'blocked' then 'blocked'
  when access_status = 'manual_only' then 'manual_only'
  else 'pending_review'
end;

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources (id) on update cascade on delete restrict,
  source_key text not null check (source_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  adapter_kind text not null check (adapter_kind in ('mock', 'approved_feed', 'approved_api')),
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual', 'schedule', 'retry', 'preview')),
  idempotency_key text not null unique,
  is_simulated boolean not null default false,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'partial', 'failed', 'skipped')),
  attempt integer not null default 1 check (attempt between 1 and 5),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  normalized_count integer not null default 0 check (normalized_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  error_code text,
  error_message text,
  scheduled_for timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ingestion_runs_source_boundary_check check (
    (is_simulated and source_id is null and adapter_kind = 'mock')
    or
    (not is_simulated and source_id is not null and adapter_kind in ('approved_feed', 'approved_api'))
  )
);

create table public.raw_items (
  id uuid primary key default gen_random_uuid(),
  ingestion_run_id uuid not null references public.ingestion_runs (id) on update cascade on delete restrict,
  source_id uuid references public.sources (id) on update cascade on delete restrict,
  source_key text not null check (source_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  external_id text not null check (length(external_id) between 1 and 500),
  original_url text not null check (original_url ~ '^https?://'),
  normalized_url text not null check (normalized_url ~ '^https?://'),
  title text not null check (length(btrim(title)) between 1 and 500),
  summary text,
  body_excerpt text,
  author text,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  raw_payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'normalized', 'rejected')),
  rejection_reason text,
  is_simulated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raw_items_source_boundary_check check (
    (is_simulated and source_id is null)
    or
    (not is_simulated and source_id is not null)
  ),
  constraint raw_items_source_external_key unique (source_key, external_id),
  constraint raw_items_source_url_key unique (source_key, normalized_url)
);

alter table public.news
  add column if not exists raw_item_id uuid references public.raw_items (id) on update cascade on delete set null,
  add column if not exists source_id uuid references public.sources (id) on update cascade on delete set null,
  add column if not exists is_simulated boolean not null default false;

create unique index if not exists news_raw_item_id_key
  on public.news (raw_item_id)
  where raw_item_id is not null;

create index ingestion_runs_source_created_idx
  on public.ingestion_runs (source_id, created_at desc)
  where source_id is not null;

create index ingestion_runs_status_created_idx
  on public.ingestion_runs (status, created_at desc);

create index raw_items_run_id_idx on public.raw_items (ingestion_run_id);
create index raw_items_content_hash_idx on public.raw_items (content_hash);
create index raw_items_published_at_idx on public.raw_items (published_at desc);
create index raw_items_pending_idx on public.raw_items (created_at)
  where processing_status = 'pending';

create trigger raw_items_set_updated_at
before update on public.raw_items
for each row execute function private.set_updated_at();

create or replace function private.enforce_ingestion_source_gate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_simulated then
    if new.source_id is not null then
      raise exception 'simulated ingestion must not impersonate a registered source';
    end if;
    return new;
  end if;

  if not exists (
    select 1
    from public.sources source
    where source.id = new.source_id
      and source.collection_enabled
      and source.active
      and source.identity_verified
      and source.access_status in ('approved_feed', 'approved_api')
      and source.operational_classification = 'approved_adapter'
  ) then
    raise exception 'source is not approved for automated collection';
  end if;

  return new;
end;
$$;

create trigger ingestion_runs_enforce_source_gate
before insert or update of source_id, is_simulated, adapter_kind
on public.ingestion_runs
for each row execute function private.enforce_ingestion_source_gate();

create trigger raw_items_enforce_source_gate
before insert or update of source_id, is_simulated
on public.raw_items
for each row execute function private.enforce_ingestion_source_gate();

revoke all on function private.enforce_ingestion_source_gate() from public, anon, authenticated;
grant execute on function private.enforce_ingestion_source_gate() to postgres, service_role;

create view public.source_health_status
with (security_invoker = true)
as
select
  source.id as source_id,
  source.slug,
  source.name,
  source.access_status,
  source.operational_classification,
  source.collection_enabled,
  source.last_successful_run_at,
  latest.status as last_run_status,
  latest.started_at as last_run_started_at,
  latest.finished_at as last_run_finished_at,
  latest.fetched_count as last_fetched_count,
  latest.inserted_count as last_inserted_count,
  latest.error_code as last_error_code,
  case
    when not source.collection_enabled then 'disabled'
    when latest.status is null then 'never_run'
    when latest.status = 'failed' then 'failing'
    when latest.status = 'partial' then 'degraded'
    when source.last_successful_run_at < now() - interval '48 hours' then 'stale'
    when latest.status = 'succeeded' then 'healthy'
    else 'unknown'
  end as health_state
from public.sources source
left join lateral (
  select run.status, run.started_at, run.finished_at, run.fetched_count,
    run.inserted_count, run.error_code
  from public.ingestion_runs run
  where run.source_id = source.id
  order by run.created_at desc
  limit 1
) latest on true;

revoke all on table public.ingestion_runs, public.raw_items from public, anon, authenticated;
revoke all on table public.source_health_status from public, anon, authenticated;
grant select, insert, update on table public.ingestion_runs, public.raw_items to service_role;
grant select on table public.source_health_status to service_role;
grant select, update on table public.sources to service_role;
grant select, insert, update, delete on table public.news, public.news_teams to service_role;

alter table public.ingestion_runs enable row level security;
alter table public.raw_items enable row level security;

comment on table public.ingestion_runs is 'Internal ingestion executions with retry, idempotency, and source-rights evidence.';
comment on table public.raw_items is 'Internal normalized source payloads. Simulated rows are explicitly marked and cannot impersonate registered sources.';
comment on view public.source_health_status is 'Service-only latest health projection for reviewed sources.';
comment on column public.news.is_simulated is 'True only for explicit acceptance or preview data; never presented as real collection.';
