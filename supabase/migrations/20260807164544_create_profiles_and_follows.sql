create table public.profiles (
  id uuid primary key references auth.users (id) on update cascade on delete cascade,
  display_name text check (display_name is null or length(btrim(display_name)) between 1 and 60),
  locale text not null default 'zh-CN' check (locale ~ '^[a-z]{2}(?:-[A-Z]{2})?$'),
  timezone text not null default 'Asia/Shanghai' check (length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_team_follows (
  user_id uuid not null references public.profiles (id) on update cascade on delete cascade,
  team_id uuid not null references public.teams (id) on update cascade on delete cascade,
  sort_order smallint not null check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, team_id),
  constraint user_team_follows_user_sort_order_key unique (user_id, sort_order)
);

create index user_team_follows_team_id_idx
  on public.user_team_follows (team_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger user_team_follows_set_updated_at
before update on public.user_team_follows
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id)
select id
from auth.users
on conflict (id) do nothing;

revoke all on table public.profiles, public.user_team_follows
  from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, locale, timezone) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_team_follows to authenticated;

alter table public.profiles enable row level security;
alter table public.user_team_follows enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can read their own follows"
  on public.user_team_follows
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own follows"
  on public.user_team_follows
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own follows"
  on public.user_team_follows
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own follows"
  on public.user_team_follows
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.profiles is 'Application profile linked one-to-one with Supabase Auth users.';
comment on table public.user_team_follows is 'Ordered club follows; unique slots 0-4 enforce a maximum of five clubs per user.';
