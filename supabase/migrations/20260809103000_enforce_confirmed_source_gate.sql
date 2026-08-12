create or replace function private.enforce_confirmed_news_source_gate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source_is_official boolean := false;
  v_source_identity_verified boolean := false;
  v_source_collection_approved boolean := false;
begin
  if new.trust_status <> 'confirmed' then
    return new;
  end if;

  select
    coalesce(s.is_official, false),
    coalesce(s.identity_verified, false),
    coalesce(s.collection_enabled and s.access_status in ('approved_feed', 'approved_api'), false)
  into v_source_is_official, v_source_identity_verified, v_source_collection_approved
  from public.sources s
  where s.id = new.source_id;

  if not coalesce(v_source_is_official, false)
    or not coalesce(v_source_identity_verified, false)
    or not coalesce(v_source_collection_approved, false)
    or not coalesce(new.direct_official_assertion, false)
    or coalesce(new.is_simulated, false) then
    raise exception 'confirmed status violates official source gate' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_confirmed_news_source_gate on public.news;
create trigger enforce_confirmed_news_source_gate
before insert or update of trust_status, source_id, direct_official_assertion, is_simulated
on public.news
for each row execute function private.enforce_confirmed_news_source_gate();

create or replace function private.downgrade_confirmed_news_after_source_revocation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_official
    and new.identity_verified
    and new.collection_enabled
    and new.access_status in ('approved_feed', 'approved_api') then
    return new;
  end if;

  with downgraded as (
    update public.news
    set trust_status = 'unverified',
      trust_reason = '来源准入状态已变化，绿色确认已自动撤销。',
      trust_updated_at = now(),
      review_state = 'pending'
    where source_id = new.id and trust_status = 'confirmed'
    returning id
  )
  insert into public.trust_status_history (
    news_id, previous_status, new_status, reason, reason_codes, actor_type
  )
  select
    id, 'confirmed', 'unverified', '来源准入状态已变化，绿色确认已自动撤销。',
    array['source_gate_revoked'], 'rule_engine'
  from downgraded;

  return new;
end;
$$;

drop trigger if exists downgrade_confirmed_news_after_source_revocation on public.sources;
create trigger downgrade_confirmed_news_after_source_revocation
after update of is_official, identity_verified, collection_enabled, access_status
on public.sources
for each row execute function private.downgrade_confirmed_news_after_source_revocation();

revoke all on function private.enforce_confirmed_news_source_gate() from public, anon, authenticated;
revoke all on function private.downgrade_confirmed_news_after_source_revocation() from public, anon, authenticated;
grant execute on function private.enforce_confirmed_news_source_gate() to postgres, service_role;
grant execute on function private.downgrade_confirmed_news_after_source_revocation() to postgres, service_role;

comment on function private.enforce_confirmed_news_source_gate() is
  'Database-wide green hard gate. Manual, API and AI writes cannot confirm unapproved, indirect or simulated news.';
comment on function private.downgrade_confirmed_news_after_source_revocation() is
  'Revoking an official source gate automatically downgrades affected green news and records history.';
