alter table public.news
  add column if not exists original_language text,
  add column if not exists translated_title text,
  add column if not exists translated_summary text,
  add column if not exists ai_processing_version text,
  add column if not exists ai_processed_at timestamptz;

create table public.ai_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid not null references public.raw_items (id) on update cascade on delete cascade,
  news_id uuid not null references public.news (id) on update cascade on delete cascade,
  task_type text not null default 'translate_extract'
    check (task_type in ('translate_extract', 'retry_translate_extract')),
  idempotency_key text not null unique,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'skipped')),
  attempt smallint not null default 1 check (attempt between 1 and 5),
  model_provider text,
  model_id text,
  model_version text,
  prompt_version text not null,
  schema_version text not null,
  input_snapshot jsonb not null,
  staged_output jsonb,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_usd numeric(12, 6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_processing_jobs_success_output_check check (
    status <> 'succeeded' or (staged_output is not null and finished_at is not null)
  )
);

create index ai_processing_jobs_work_queue_idx
  on public.ai_processing_jobs (created_at)
  where status in ('queued', 'failed');

create index ai_processing_jobs_news_created_idx
  on public.ai_processing_jobs (news_id, created_at desc);

create index ai_processing_jobs_raw_item_idx
  on public.ai_processing_jobs (raw_item_id);

create trigger ai_processing_jobs_set_updated_at
before update on public.ai_processing_jobs
for each row execute function private.set_updated_at();

create view public.ai_cost_summary_daily
with (security_invoker = true)
as
select
  date_trunc('day', created_at) as usage_day,
  model_provider,
  model_id,
  count(*) filter (where status = 'succeeded') as succeeded_jobs,
  count(*) filter (where status = 'failed') as failed_jobs,
  coalesce(sum(input_tokens), 0) as input_tokens,
  coalesce(sum(output_tokens), 0) as output_tokens,
  coalesce(sum(estimated_cost_usd), 0) as estimated_cost_usd
from public.ai_processing_jobs
group by date_trunc('day', created_at), model_provider, model_id;

alter table public.ai_processing_jobs enable row level security;

revoke all on table public.ai_processing_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_processing_jobs to service_role;
revoke all on table public.ai_cost_summary_daily from public, anon, authenticated;
grant select on table public.ai_cost_summary_daily to service_role;

create or replace function public.finalize_ai_processing_job(
  p_job_id uuid,
  p_output jsonb,
  p_provider text,
  p_model_id text,
  p_model_version text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_usd numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_news_id uuid;
begin
  select news_id into v_news_id from public.ai_processing_jobs where id = p_job_id and status = 'running' for update;
  if not found then raise exception 'running job not found' using errcode = 'P0002'; end if;

  update public.news set
    original_language = p_output->>'originalLanguage',
    translated_title = p_output->>'translatedTitle',
    translated_summary = p_output->>'translatedSummary',
    title = p_output->>'translatedTitle',
    summary = p_output->>'translatedSummary',
    info_type = p_output->>'infoType',
    event_at = nullif(p_output->>'eventAt', '')::timestamptz,
    ai_processing_version = coalesce(p_model_version, p_model_id),
    ai_processed_at = now()
  where id = v_news_id;

  update public.ai_processing_jobs set
    status = 'succeeded', staged_output = p_output, model_provider = p_provider,
    model_id = p_model_id, model_version = p_model_version,
    input_tokens = p_input_tokens, output_tokens = p_output_tokens,
    estimated_cost_usd = p_estimated_cost_usd, finished_at = now(),
    error_code = null, error_message = null
  where id = p_job_id;
end;
$$;

revoke all on function public.finalize_ai_processing_job(uuid, jsonb, text, text, text, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.finalize_ai_processing_job(uuid, jsonb, text, text, text, integer, integer, numeric) to service_role;

comment on table public.ai_processing_jobs is 'Server-only retryable AI work ledger. Output stays staged until validation succeeds.';
comment on column public.ai_processing_jobs.staged_output is 'Schema-validated candidate output; production news fields are updated only after fidelity gates pass.';
comment on column public.ai_processing_jobs.estimated_cost_usd is 'Estimated provider cost recorded per attempt; null when no billable model was called.';
comment on view public.ai_cost_summary_daily is 'Server-only daily token, failure and estimated-cost report.';
