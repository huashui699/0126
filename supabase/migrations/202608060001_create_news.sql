create extension if not exists pgcrypto;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content text,
  source text,
  url text,
  image text,
  league text,
  team text,
  created_at timestamptz not null default now()
);

create index if not exists news_created_at_idx
  on public.news (created_at desc);

grant select on table public.news to anon, authenticated;
revoke insert, update, delete on table public.news from anon, authenticated;

alter table public.news enable row level security;

drop policy if exists "Public can read published news" on public.news;
create policy "Public can read published news"
  on public.news
  for select
  to anon, authenticated
  using (true);

insert into public.news (title, summary, source, league, team)
select *
from (
  values
    (
      '皇马开启新赛季备战',
      '球队正在进行夏季训练，新援逐渐融入阵容。',
      '0126 Football',
      '西甲',
      '皇家马德里'
    ),
    (
      '曼城公布新赛季计划',
      '球队正围绕新赛季目标推进训练与阵容磨合。',
      '0126 Football',
      '英超',
      '曼城'
    )
) as seed(title, summary, source, league, team)
where not exists (select 1 from public.news);

