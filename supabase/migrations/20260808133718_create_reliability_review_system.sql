alter table public.event_clusters
  add column if not exists fingerprint text,
  add column if not exists cluster_method text not null default 'manual'
    check (cluster_method in ('canonical_url', 'title_similarity', 'semantic_review', 'manual')),
  add column if not exists cluster_explanation text not null default '等待聚类证据。',
  add column if not exists merged_into_id uuid references public.event_clusters (id) on update cascade on delete restrict;

create unique index event_clusters_fingerprint_key
  on public.event_clusters (fingerprint)
  where fingerprint is not null and merged_into_id is null;

create index event_clusters_merged_into_idx
  on public.event_clusters (merged_into_id)
  where merged_into_id is not null;

create table public.source_citations (
  id uuid primary key default gen_random_uuid(),
  child_news_id uuid not null references public.news (id) on update cascade on delete cascade,
  parent_news_id uuid references public.news (id) on update cascade on delete set null,
  cited_url text not null,
  cited_domain text not null,
  relationship text not null check (relationship in ('direct', 'quotes', 'republication', 'unknown')),
  is_independent boolean not null default false,
  independence_reason text not null,
  created_at timestamptz not null default now(),
  constraint source_citations_not_self_check check (parent_news_id is null or parent_news_id <> child_news_id),
  constraint source_citations_child_url_key unique (child_news_id, cited_url)
);

create table public.reliability_assessments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.news (id) on update cascade on delete cascade,
  status text not null check (status in ('confirmed', 'unverified', 'rumor')),
  reason_codes text[] not null check (cardinality(reason_codes) > 0),
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  engine_version text not null,
  source_is_official boolean not null default false,
  source_identity_verified boolean not null default false,
  direct_official_assertion boolean not null default false,
  independent_source_count smallint not null default 0 check (independent_source_count >= 0),
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.review_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null check (action_type in ('set_trust', 'hide', 'unhide', 'merge_cluster', 'revert')),
  action_status text not null default 'applied' check (action_status in ('applied', 'reverted')),
  news_id uuid references public.news (id) on update cascade on delete restrict,
  cluster_id uuid references public.event_clusters (id) on update cascade on delete restrict,
  merge_into_cluster_id uuid references public.event_clusters (id) on update cascade on delete restrict,
  before_state jsonb not null,
  after_state jsonb not null,
  reason text not null check (length(btrim(reason)) between 3 and 500),
  actor_ref text not null check (length(btrim(actor_ref)) between 3 and 200),
  reverses_action_id uuid references public.review_actions (id) on update cascade on delete restrict,
  reverted_by_action_id uuid references public.review_actions (id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  reverted_at timestamptz
);

create table public.trust_status_history (
  id bigint generated always as identity primary key,
  news_id uuid not null references public.news (id) on update cascade on delete cascade,
  previous_status text check (previous_status is null or previous_status in ('confirmed', 'unverified', 'rumor')),
  new_status text not null check (new_status in ('confirmed', 'unverified', 'rumor')),
  reason text not null,
  reason_codes text[] not null default '{}',
  actor_type text not null check (actor_type in ('rule_engine', 'operator', 'revert')),
  review_action_id uuid references public.review_actions (id) on update cascade on delete set null,
  created_at timestamptz not null default now()
);

alter table public.news
  add column if not exists review_state text not null default 'not_required'
    check (review_state in ('not_required', 'pending', 'reviewed')),
  add column if not exists direct_official_assertion boolean not null default false,
  add column if not exists hidden_at timestamptz;

drop policy if exists "Public can read published news" on public.news;
create policy "Public can read visible news"
  on public.news
  for select
  to anon, authenticated
  using (hidden_at is null);

revoke select on table public.news from anon, authenticated;
grant select (
  id, title, summary, content, source, url, image, league, team, created_at,
  published_at, event_at, info_type, trust_status, trust_reason, trust_updated_at, updated_at
) on table public.news to anon, authenticated;

create index source_citations_child_news_idx on public.source_citations (child_news_id);
create index source_citations_parent_news_idx on public.source_citations (parent_news_id) where parent_news_id is not null;
create index reliability_assessments_news_created_idx on public.reliability_assessments (news_id, created_at desc);
create index reliability_assessments_review_queue_idx on public.reliability_assessments (created_at) where requires_review;
create index review_actions_news_created_idx on public.review_actions (news_id, created_at desc) where news_id is not null;
create index review_actions_cluster_created_idx on public.review_actions (cluster_id, created_at desc) where cluster_id is not null;
create index review_actions_merge_into_cluster_idx on public.review_actions (merge_into_cluster_id) where merge_into_cluster_id is not null;
create index review_actions_reverses_action_idx on public.review_actions (reverses_action_id) where reverses_action_id is not null;
create index review_actions_reverted_by_action_idx on public.review_actions (reverted_by_action_id) where reverted_by_action_id is not null;
create index trust_status_history_news_created_idx on public.trust_status_history (news_id, created_at desc);
create index trust_status_history_review_action_idx on public.trust_status_history (review_action_id) where review_action_id is not null;
create index news_review_queue_idx on public.news (published_at desc) where review_state = 'pending';

alter table public.source_citations enable row level security;
alter table public.reliability_assessments enable row level security;
alter table public.review_actions enable row level security;
alter table public.trust_status_history enable row level security;

revoke all on table public.source_citations, public.reliability_assessments, public.review_actions, public.trust_status_history
  from public, anon, authenticated;
grant select, insert, update, delete on table public.source_citations, public.reliability_assessments, public.review_actions, public.trust_status_history
  to service_role;

create or replace function public.get_news_trust_history(p_news_id uuid)
returns table (
  previous_status text,
  new_status text,
  reason text,
  reason_codes text[],
  actor_type text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.previous_status, h.new_status, h.reason, h.reason_codes, h.actor_type, h.created_at
  from public.trust_status_history h
  join public.news n on n.id = h.news_id
  where h.news_id = p_news_id and n.hidden_at is null
  order by h.created_at desc;
$$;

revoke all on function public.get_news_trust_history(uuid) from public;
grant execute on function public.get_news_trust_history(uuid) to anon, authenticated, service_role;

create or replace function public.record_reliability_assessment(
  p_news_id uuid,
  p_status text,
  p_reason_codes text[],
  p_explanation text,
  p_evidence jsonb,
  p_engine_version text,
  p_independent_source_count smallint,
  p_requires_review boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_previous text;
  v_official boolean;
  v_verified boolean;
  v_approved boolean;
  v_direct boolean;
  v_simulated boolean;
begin
  select n.trust_status, coalesce(s.is_official, false), coalesce(s.identity_verified, false),
    coalesce(s.collection_enabled and s.access_status in ('approved_feed', 'approved_api'), false),
    n.direct_official_assertion, n.is_simulated
  into v_previous, v_official, v_verified, v_approved, v_direct, v_simulated
  from public.news n left join public.sources s on s.id = n.source_id
  where n.id = p_news_id for update of n;
  if not found then raise exception 'news not found' using errcode = 'P0002'; end if;
  if p_status not in ('confirmed', 'unverified', 'rumor') then raise exception 'invalid status' using errcode = '22023'; end if;
  if p_status = 'confirmed' and not (v_official and v_verified and v_approved and v_direct and not v_simulated) then
    raise exception 'confirmed status violates official source gate' using errcode = '23514';
  end if;

  insert into public.reliability_assessments (
    id, news_id, status, reason_codes, explanation, evidence, engine_version,
    source_is_official, source_identity_verified, direct_official_assertion,
    independent_source_count, requires_review
  ) values (
    v_id, p_news_id, p_status, p_reason_codes, p_explanation, p_evidence, p_engine_version,
    v_official, v_verified, v_direct, p_independent_source_count, p_requires_review
  );
  update public.news set trust_status = p_status, trust_reason = p_explanation, trust_updated_at = now(),
    review_state = case when p_requires_review then 'pending' else 'not_required' end
  where id = p_news_id;
  if v_previous is distinct from p_status then
    insert into public.trust_status_history (news_id, previous_status, new_status, reason, reason_codes, actor_type)
    values (p_news_id, v_previous, p_status, p_explanation, p_reason_codes, 'rule_engine');
  end if;
  return v_id;
end;
$$;

revoke all on function public.record_reliability_assessment(uuid, text, text[], text, jsonb, text, smallint, boolean) from public, anon, authenticated;
grant execute on function public.record_reliability_assessment(uuid, text, text[], text, jsonb, text, smallint, boolean) to service_role;

create or replace function public.apply_review_action(
  p_action_type text,
  p_reason text,
  p_actor_ref text,
  p_news_id uuid default null,
  p_new_trust text default null,
  p_cluster_id uuid default null,
  p_merge_into_cluster_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action_id uuid := gen_random_uuid();
  v_before jsonb;
  v_after jsonb;
  v_previous_status text;
begin
  if length(btrim(p_reason)) < 3 or length(btrim(p_actor_ref)) < 3 then raise exception 'reason and actor are required' using errcode = '22023'; end if;

  if p_action_type = 'set_trust' then
    if p_new_trust not in ('confirmed', 'unverified', 'rumor') then raise exception 'invalid trust status' using errcode = '22023'; end if;
    select trust_status into v_previous_status from public.news where id = p_news_id for update;
    if not found then raise exception 'news not found' using errcode = 'P0002'; end if;
    v_before := jsonb_build_object('trust_status', v_previous_status);
    update public.news set trust_status = p_new_trust, trust_reason = p_reason, trust_updated_at = now(), review_state = 'reviewed' where id = p_news_id;
    v_after := jsonb_build_object('trust_status', p_new_trust);
  elsif p_action_type in ('hide', 'unhide') then
    select jsonb_build_object('hidden_at', hidden_at) into v_before from public.news where id = p_news_id for update;
    if not found then raise exception 'news not found' using errcode = 'P0002'; end if;
    update public.news set hidden_at = case when p_action_type = 'hide' then now() else null end, review_state = 'reviewed' where id = p_news_id;
    select jsonb_build_object('hidden_at', hidden_at) into v_after from public.news where id = p_news_id;
  elsif p_action_type = 'merge_cluster' then
    if p_cluster_id is null or p_merge_into_cluster_id is null or p_cluster_id = p_merge_into_cluster_id then raise exception 'two distinct clusters are required' using errcode = '22023'; end if;
    perform 1 from public.event_clusters where id = p_cluster_id and merged_into_id is null for update;
    if not found then raise exception 'source cluster not found or already merged' using errcode = 'P0002'; end if;
    perform 1 from public.event_clusters where id = p_merge_into_cluster_id and merged_into_id is null for update;
    if not found then raise exception 'target cluster not found or already merged' using errcode = 'P0002'; end if;
    v_before := jsonb_build_object('merged_into_id', null);
    update public.event_clusters set merged_into_id = p_merge_into_cluster_id, cluster_explanation = p_reason where id = p_cluster_id;
    insert into public.cluster_items (cluster_id, news_id, is_primary)
      select p_merge_into_cluster_id, news_id, false from public.cluster_items where cluster_id = p_cluster_id
      on conflict (cluster_id, news_id) do nothing;
    v_after := jsonb_build_object('merged_into_id', p_merge_into_cluster_id);
  else
    raise exception 'unsupported action' using errcode = '22023';
  end if;

  insert into public.review_actions (id, action_type, news_id, cluster_id, merge_into_cluster_id, before_state, after_state, reason, actor_ref)
  values (v_action_id, p_action_type, p_news_id, p_cluster_id, p_merge_into_cluster_id, v_before, v_after, p_reason, p_actor_ref);

  if p_action_type = 'set_trust' and v_previous_status is distinct from p_new_trust then
    insert into public.trust_status_history (news_id, previous_status, new_status, reason, reason_codes, actor_type, review_action_id)
    values (p_news_id, v_previous_status, p_new_trust, p_reason, array['manual_override'], 'operator', v_action_id);
  end if;
  return v_action_id;
end;
$$;

create or replace function public.revert_review_action(p_action_id uuid, p_reason text, p_actor_ref text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_original public.review_actions%rowtype;
  v_revert_id uuid := gen_random_uuid();
  v_current_status text;
begin
  select * into v_original from public.review_actions where id = p_action_id and action_status = 'applied' for update;
  if not found or v_original.action_type = 'revert' then raise exception 'action is not revertible' using errcode = 'P0002'; end if;

  if v_original.action_type = 'set_trust' then
    select trust_status into v_current_status from public.news where id = v_original.news_id for update;
    update public.news set trust_status = v_original.before_state->>'trust_status', trust_reason = p_reason, trust_updated_at = now() where id = v_original.news_id;
  elsif v_original.action_type in ('hide', 'unhide') then
    update public.news set hidden_at = (v_original.before_state->>'hidden_at')::timestamptz where id = v_original.news_id;
  elsif v_original.action_type = 'merge_cluster' then
    delete from public.cluster_items target
      where target.cluster_id = v_original.merge_into_cluster_id
        and exists (select 1 from public.cluster_items source where source.cluster_id = v_original.cluster_id and source.news_id = target.news_id);
    update public.event_clusters set merged_into_id = null, cluster_explanation = p_reason where id = v_original.cluster_id;
  end if;

  insert into public.review_actions (id, action_type, news_id, cluster_id, merge_into_cluster_id, before_state, after_state, reason, actor_ref, reverses_action_id)
  values (v_revert_id, 'revert', v_original.news_id, v_original.cluster_id, v_original.merge_into_cluster_id, v_original.after_state, v_original.before_state, p_reason, p_actor_ref, p_action_id);
  update public.review_actions set action_status = 'reverted', reverted_by_action_id = v_revert_id, reverted_at = now() where id = p_action_id;

  if v_original.action_type = 'set_trust' then
    insert into public.trust_status_history (news_id, previous_status, new_status, reason, reason_codes, actor_type, review_action_id)
    values (v_original.news_id, v_current_status, v_original.before_state->>'trust_status', p_reason, array['manual_revert'], 'revert', v_revert_id);
  end if;
  return v_revert_id;
end;
$$;

revoke all on function public.apply_review_action(text, text, text, uuid, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.revert_review_action(uuid, text, text) from public, anon, authenticated;
grant execute on function public.apply_review_action(text, text, text, uuid, text, uuid, uuid) to service_role;
grant execute on function public.revert_review_action(uuid, text, text) to service_role;

comment on table public.source_citations is 'Citation graph used to prevent republications from being counted as independent confirmation.';
comment on table public.reliability_assessments is 'Versioned, explainable rule-engine output. AI signals cannot bypass the official-source green gate.';
comment on table public.review_actions is 'Append-only operator audit log; reverts create a second action instead of deleting history.';
comment on function public.get_news_trust_history(uuid) is 'Sanitized public status history for one visible news item.';
