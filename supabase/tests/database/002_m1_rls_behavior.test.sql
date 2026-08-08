begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '50000000-0000-4000-8000-000000000001',
    'm1-user-a@example.test',
    '{"display_name":"M1 User A"}'::jsonb
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'm1-user-b@example.test',
    '{"display_name":"M1 User B"}'::jsonb
  );

select results_eq(
  $$
    select count(*)::bigint
    from public.profiles
    where id::text like '50000000-0000-4000-8000-%'
  $$,
  $$ values (2::bigint) $$,
  'auth user creation provisions both profiles'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true);

select results_eq(
  $$ select id from public.profiles order by id $$,
  $$ values ('50000000-0000-4000-8000-000000000001'::uuid) $$,
  'user A can read only their profile'
);

select lives_ok(
  $$ update public.profiles set display_name = 'User A updated' where id = '50000000-0000-4000-8000-000000000001' $$,
  'user A can update their display name'
);

select results_eq(
  $$
    with updated as (
      update public.profiles
      set display_name = 'Unauthorized update'
      where id = '50000000-0000-4000-8000-000000000002'
      returning id
    )
    select count(*)::bigint from updated
  $$,
  $$ values (0::bigint) $$,
  'user A cannot update user B profile'
);

select lives_ok(
  $$
    insert into public.user_team_follows (user_id, team_id, sort_order)
    values (
      '50000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      0
    )
  $$,
  'user A can create their own follow'
);

select results_eq(
  $$ select user_id, sort_order from public.user_team_follows order by sort_order $$,
  $$ values ('50000000-0000-4000-8000-000000000001'::uuid, 0::smallint) $$,
  'user A can read only their follow'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true);

select is_empty(
  $$ select user_id from public.user_team_follows $$,
  'user B cannot read user A follow'
);

select lives_ok(
  $$
    insert into public.user_team_follows (user_id, team_id, sort_order)
    values (
      '50000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000002',
      0
    )
  $$,
  'user B can create their own follow'
);

select results_eq(
  $$ select user_id, sort_order from public.user_team_follows order by sort_order $$,
  $$ values ('50000000-0000-4000-8000-000000000002'::uuid, 0::smallint) $$,
  'user B can read only their follow'
);

select results_eq(
  $$
    with deleted as (
      delete from public.user_team_follows
      where user_id = '50000000-0000-4000-8000-000000000001'
      returning user_id
    )
    select count(*)::bigint from deleted
  $$,
  $$ values (0::bigint) $$,
  'user B cannot delete user A follow'
);

select lives_ok(
  $$
    delete from public.user_team_follows
    where user_id = '50000000-0000-4000-8000-000000000002'
  $$,
  'user B can delete their own follow'
);

select * from finish();

rollback;

