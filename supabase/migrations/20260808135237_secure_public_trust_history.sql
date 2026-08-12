drop function if exists public.get_news_trust_history(uuid);

create policy "Visible news trust history is publicly readable"
  on public.trust_status_history
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.news
      where news.id = trust_status_history.news_id
        and news.hidden_at is null
    )
  );

grant select (news_id, previous_status, new_status, reason, reason_codes, actor_type, created_at)
  on table public.trust_status_history to anon, authenticated;

create view public.news_trust_history_public
with (security_invoker = true)
as
select news_id, previous_status, new_status, reason, reason_codes, actor_type, created_at
from public.trust_status_history;

revoke all on table public.news_trust_history_public from public;
grant select on table public.news_trust_history_public to anon, authenticated, service_role;

comment on view public.news_trust_history_public is 'Sanitized trust history protected by the underlying news visibility and history RLS policies.';
