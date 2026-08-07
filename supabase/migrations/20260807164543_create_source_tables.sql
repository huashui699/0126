create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  source_type text not null
    check (source_type in ('club_official', 'league_official', 'media', 'journalist', 'community')),
  homepage_url text not null,
  feed_url text,
  access_method text not null
    check (access_method in ('rss', 'api', 'html', 'manual')),
  access_status text not null
    check (access_status in (
      'approved_feed',
      'approved_api',
      'technical_review',
      'rights_review',
      'paid_api',
      'manual_only',
      'blocked'
    )),
  is_official boolean not null default false,
  identity_verified boolean not null default false,
  default_reliability text not null default 'unverified'
    check (default_reliability in ('confirmed', 'unverified', 'rumor')),
  rights_notes text not null default '',
  last_reviewed_at date,
  collection_enabled boolean not null default false,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_collection_requires_approval_check check (
    not collection_enabled
    or (
      access_status in ('approved_feed', 'approved_api')
      and identity_verified
      and active
    )
  )
);

create table public.source_accounts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on update cascade on delete cascade,
  team_id uuid references public.teams (id) on update cascade on delete set null,
  league_id uuid references public.leagues (id) on update cascade on delete set null,
  platform text not null
    check (platform in ('website', 'rss', 'youtube', 'x', 'instagram', 'tiktok', 'weibo', 'douyin', 'wechat')),
  handle text,
  platform_account_id text,
  profile_url text not null,
  verification_method text not null
    check (verification_method in ('official_site_link', 'platform_verified', 'manual_review')),
  verified_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_accounts_source_platform_profile_key
    unique (source_id, platform, profile_url)
);

create index source_accounts_source_id_idx
  on public.source_accounts (source_id);

create index source_accounts_team_id_idx
  on public.source_accounts (team_id)
  where team_id is not null;

create index source_accounts_league_id_idx
  on public.source_accounts (league_id)
  where league_id is not null;

create unique index source_accounts_platform_account_id_key
  on public.source_accounts (platform, platform_account_id)
  where platform_account_id is not null;

create trigger sources_set_updated_at
before update on public.sources
for each row execute function private.set_updated_at();

create trigger source_accounts_set_updated_at
before update on public.source_accounts
for each row execute function private.set_updated_at();

revoke all on table public.sources, public.source_accounts
  from public, anon, authenticated;

alter table public.sources enable row level security;
alter table public.source_accounts enable row level security;

comment on table public.sources is 'Internal registry of publishers, rights status, and collection approval.';
comment on table public.source_accounts is 'Verified platform identities associated with a registered source.';
comment on column public.sources.collection_enabled is 'True only after explicit feed/API approval; identity verification alone is insufficient.';
