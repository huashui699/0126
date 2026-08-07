create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_zh text not null,
  name_en text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  display_order smallint not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on update cascade on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_zh text not null,
  name_en text not null,
  short_name_zh text not null,
  short_name_en text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  official_domain text,
  logo_url text,
  display_order smallint not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_aliases (
  id bigint generated always as identity primary key,
  team_id uuid not null references public.teams (id) on update cascade on delete cascade,
  alias text not null check (length(btrim(alias)) between 1 and 100),
  normalized_alias text generated always as (lower(btrim(alias))) stored,
  language_code text not null check (language_code ~ '^[a-z]{2}(?:-[A-Z]{2})?$'),
  alias_type text not null default 'common'
    check (alias_type in ('official', 'short', 'common', 'nickname')),
  created_at timestamptz not null default now(),
  constraint team_aliases_team_language_alias_key
    unique (team_id, language_code, normalized_alias)
);

create index teams_league_id_display_order_idx
  on public.teams (league_id, display_order)
  where active;

create index team_aliases_normalized_alias_language_idx
  on public.team_aliases (normalized_alias, language_code);

create index team_aliases_team_id_idx
  on public.team_aliases (team_id);

create trigger leagues_set_updated_at
before update on public.leagues
for each row execute function private.set_updated_at();

create trigger teams_set_updated_at
before update on public.teams
for each row execute function private.set_updated_at();

revoke all on table public.leagues, public.teams, public.team_aliases
  from public, anon, authenticated;

grant select on table public.leagues, public.teams, public.team_aliases
  to anon, authenticated;

alter table public.leagues enable row level security;
alter table public.teams enable row level security;
alter table public.team_aliases enable row level security;

create policy "Active leagues are publicly readable"
  on public.leagues
  for select
  to anon, authenticated
  using (active);

create policy "Active teams are publicly readable"
  on public.teams
  for select
  to anon, authenticated
  using (
    active
    and exists (
      select 1
      from public.leagues
      where leagues.id = teams.league_id
        and leagues.active
    )
  );

create policy "Aliases of active teams are publicly readable"
  on public.team_aliases
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.teams
      where teams.id = team_aliases.team_id
        and teams.active
    )
  );

comment on table public.leagues is 'Five-league catalog shared by all clients.';
comment on table public.teams is 'Platform-neutral club catalog with stable UUID identifiers.';
comment on table public.team_aliases is 'Multilingual search and entity-matching aliases for clubs.';
