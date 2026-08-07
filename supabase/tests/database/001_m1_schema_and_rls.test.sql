begin;

create extension if not exists pgtap with schema extensions;

select plan(32);

select has_table('public', 'leagues', 'leagues table exists');
select has_table('public', 'teams', 'teams table exists');
select has_table('public', 'team_aliases', 'team_aliases table exists');
select has_table('public', 'sources', 'sources table exists');
select has_table('public', 'source_accounts', 'source_accounts table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'user_team_follows', 'user_team_follows table exists');

select results_eq(
  $$
    select count(*)::bigint
    from pg_class
    where oid in (
      'public.leagues'::regclass,
      'public.teams'::regclass,
      'public.team_aliases'::regclass,
      'public.sources'::regclass,
      'public.source_accounts'::regclass,
      'public.profiles'::regclass,
      'public.user_team_follows'::regclass
    )
      and relrowsecurity
  $$,
  $$ values (7::bigint) $$,
  'RLS is enabled on every M1 public table'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'leagues' $$,
  $$ values (1::bigint) $$,
  'leagues has one public-read policy'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'teams' $$,
  $$ values (1::bigint) $$,
  'teams has one public-read policy'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'team_aliases' $$,
  $$ values (1::bigint) $$,
  'team_aliases has one public-read policy'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('sources', 'source_accounts') $$,
  $$ values (0::bigint) $$,
  'internal source tables expose no client RLS policy'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'profiles' $$,
  $$ values (2::bigint) $$,
  'profiles has own-row read and update policies'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'user_team_follows' $$,
  $$ values (4::bigint) $$,
  'follows has own-row CRUD policies'
);

select ok(
  not has_table_privilege('anon', 'public.sources', 'select'),
  'anonymous clients cannot read the internal source registry'
);

select ok(
  not has_table_privilege('authenticated', 'public.sources', 'select'),
  'authenticated clients cannot read the internal source registry directly'
);

select ok(
  has_table_privilege('anon', 'public.teams', 'select'),
  'anonymous clients can read the public team catalog'
);

select ok(
  has_table_privilege('authenticated', 'public.user_team_follows', 'select'),
  'authenticated clients can query follows subject to RLS'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'),
  'authenticated clients may update the display_name column subject to RLS'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'id', 'update'),
  'authenticated clients cannot update profile IDs'
);

select results_eq(
  $$ select count(*)::bigint from public.leagues where id::text like '10000000-0000-4000-8000-%' $$,
  $$ values (5::bigint) $$,
  'seed contains five leagues'
);

select results_eq(
  $$ select count(*)::bigint from public.teams where id::text like '20000000-0000-4000-8000-%' $$,
  $$ values (14::bigint) $$,
  'seed contains fourteen teams'
);

select results_eq(
  $$ select count(*)::bigint from public.team_aliases where team_id::text like '20000000-0000-4000-8000-%' $$,
  $$ values (62::bigint) $$,
  'seed contains sixty-two multilingual team aliases'
);

select results_eq(
  $$ select count(*)::bigint from public.sources where id::text like '30000000-0000-4000-8000-%' $$,
  $$ values (19::bigint) $$,
  'seed contains nineteen official source identities'
);

select results_eq(
  $$ select count(*)::bigint from public.source_accounts where id::text like '40000000-0000-4000-8000-%' $$,
  $$ values (19::bigint) $$,
  'seed contains nineteen verified website accounts'
);

select results_eq(
  $$ select count(*)::bigint from public.sources where collection_enabled $$,
  $$ values (0::bigint) $$,
  'no unapproved production collection is enabled'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.user_team_follows'::regclass
      and conname = 'user_team_follows_sort_order_check'
  $$,
  $$ values (1::bigint) $$,
  'follow sort slots are constrained to zero through four'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.user_team_follows'::regclass
      and conname = 'user_team_follows_user_sort_order_key'
  $$,
  $$ values (1::bigint) $$,
  'follow sort slots are unique per user'
);

select has_index('public', 'teams', 'teams_league_id_display_order_idx', 'team league lookup is indexed');
select has_index('public', 'team_aliases', 'team_aliases_normalized_alias_language_idx', 'alias lookup is indexed');
select has_index('public', 'source_accounts', 'source_accounts_source_id_idx', 'source account foreign key is indexed');
select has_index('public', 'user_team_follows', 'user_team_follows_team_id_idx', 'follow team foreign key is indexed');

select * from finish();

rollback;
