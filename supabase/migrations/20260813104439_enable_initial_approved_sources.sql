begin;

update public.sources
set
  access_method = 'html',
  access_status = 'approved_feed',
  operational_classification = 'approved_adapter',
  collection_enabled = true,
  active = true,
  last_reviewed_at = date '2026-08-13',
  rights_notes = concat_ws(
    E'\n',
    nullif(btrim(rights_notes), ''),
    'Metadata-only discovery approved by the product owner on 2026-08-13; article bodies remain on the publisher site.'
  )
where slug in ('premier-league-official', 'liverpool-official', 'arsenal-official')
  and is_official
  and identity_verified;

update public.source_discovery_configs
set
  enabled = true,
  discovery_format = 'auto',
  max_items = 20,
  last_error = null
where source_id in (
  select id
  from public.sources
  where slug in ('premier-league-official', 'liverpool-official', 'arsenal-official')
);

insert into public.news_teams (news_id, team_id, relationship)
select news.id, team.id, 'subject'
from (
  values
    ('曼城公布新赛季计划', 'manchester-city'),
    ('皇马开启新赛季备战', 'real-madrid')
) as target(news_title, team_slug)
join public.news news on news.title = target.news_title
join public.teams team on team.slug = target.team_slug
on conflict (news_id, team_id) do nothing;

commit;
