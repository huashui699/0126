alter table public.news
  add column if not exists published_at timestamptz,
  add column if not exists event_at timestamptz,
  add column if not exists info_type text not null default 'club_announcement'
    check (info_type in ('club_announcement', 'match', 'player', 'transfer', 'coaching', 'social', 'media')),
  add column if not exists trust_status text not null default 'unverified'
    check (trust_status in ('confirmed', 'unverified', 'rumor')),
  add column if not exists trust_reason text not null default '来源和证据仍在核对中。',
  add column if not exists trust_updated_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.news
set published_at = created_at
where published_at is null;

alter table public.news
  alter column published_at set default now(),
  alter column published_at set not null;

create table public.event_clusters (
  id uuid primary key default gen_random_uuid(),
  canonical_title text not null check (length(btrim(canonical_title)) between 1 and 240),
  event_at timestamptz,
  trust_status text not null default 'unverified'
    check (trust_status in ('confirmed', 'unverified', 'rumor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cluster_items (
  cluster_id uuid not null references public.event_clusters (id) on update cascade on delete cascade,
  news_id uuid not null references public.news (id) on update cascade on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (cluster_id, news_id)
);

create unique index cluster_items_one_primary_per_cluster_idx
  on public.cluster_items (cluster_id)
  where is_primary;

create table public.news_teams (
  news_id uuid not null references public.news (id) on update cascade on delete cascade,
  team_id uuid not null references public.teams (id) on update cascade on delete cascade,
  relationship text not null default 'subject'
    check (relationship in ('subject', 'opponent', 'mentioned')),
  created_at timestamptz not null default now(),
  primary key (news_id, team_id)
);

create index news_published_at_idx on public.news (published_at desc);
create index news_event_at_idx on public.news (event_at) where event_at is not null;
create index news_info_type_published_at_idx on public.news (info_type, published_at desc);
create index news_trust_status_published_at_idx on public.news (trust_status, published_at desc);
create index event_clusters_event_at_idx on public.event_clusters (event_at) where event_at is not null;
create index cluster_items_news_id_idx on public.cluster_items (news_id);
create index news_teams_team_id_news_id_idx on public.news_teams (team_id, news_id);

create trigger news_set_updated_at
before update on public.news
for each row execute function private.set_updated_at();

create trigger event_clusters_set_updated_at
before update on public.event_clusters
for each row execute function private.set_updated_at();

revoke all on table public.event_clusters, public.cluster_items, public.news_teams
  from public, anon, authenticated;

grant select on table public.event_clusters, public.cluster_items, public.news_teams
  to anon, authenticated;

grant select (
  id, title, summary, content, source, url, image, league, team, created_at,
  published_at, event_at, info_type, trust_status, trust_reason, trust_updated_at, updated_at
) on table public.news to anon, authenticated;

alter table public.event_clusters enable row level security;
alter table public.cluster_items enable row level security;
alter table public.news_teams enable row level security;

create policy "Event clusters are publicly readable"
  on public.event_clusters
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.cluster_items
      join public.news on news.id = cluster_items.news_id
      where cluster_items.cluster_id = event_clusters.id
    )
  );

create policy "Cluster items are publicly readable"
  on public.cluster_items
  for select
  to anon, authenticated
  using (exists (select 1 from public.news where news.id = cluster_items.news_id));

create policy "News team relationships are publicly readable"
  on public.news_teams
  for select
  to anon, authenticated
  using (exists (select 1 from public.news where news.id = news_teams.news_id));

comment on column public.news.published_at is 'Original publication timestamp stored in UTC.';
comment on column public.news.event_at is 'Optional event timestamp; present only for explicit scheduled or occurred events.';
comment on column public.news.trust_status is 'Display status based on stored evidence; it is not an assertion of absolute truth.';
comment on table public.event_clusters is 'Canonical event shared by one or more news reports.';
comment on table public.cluster_items is 'Many-to-many membership between event clusters and news reports.';
comment on table public.news_teams is 'Many-to-many team relationship used by calendar filters and future clients.';

