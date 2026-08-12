create table public.source_discovery_configs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on update cascade on delete cascade,
  discovery_url text not null check (discovery_url ~ '^https://'),
  discovery_format text not null default 'auto'
    check (discovery_format in ('auto', 'sitemap', 'rss', 'atom')),
  max_items integer not null default 20 check (max_items between 1 and 100),
  enabled boolean not null default false,
  last_attempted_at timestamptz,
  last_succeeded_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_discovery_configs_source_url_key unique (source_id, discovery_url)
);

create index source_discovery_configs_enabled_idx
  on public.source_discovery_configs (source_id)
  where enabled;

create trigger source_discovery_configs_set_updated_at
before update on public.source_discovery_configs
for each row execute function private.set_updated_at();

insert into public.source_discovery_configs (source_id, discovery_url)
select source.id, regexp_replace(source.homepage_url, '/+$', '') || '/robots.txt'
from public.sources source
where source.id::text like '30000000-0000-4000-8000-%'
on conflict (source_id, discovery_url) do nothing;

update public.source_discovery_configs
set discovery_url = 'https://www.premierleague.com/robots.txt'
where source_id = '30000000-0000-4000-8000-000000000001';

revoke all on table public.source_discovery_configs from public, anon, authenticated;
grant select, insert, update, delete on table public.source_discovery_configs to service_role;

alter table public.source_discovery_configs enable row level security;

comment on table public.source_discovery_configs is
  'Service-only allowlist for metadata discovery. A row must remain disabled until source access is separately approved.';
comment on column public.source_discovery_configs.enabled is
  'Enables scheduled discovery only; the source table approval gate is still enforced independently.';
