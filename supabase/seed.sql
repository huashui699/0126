-- Idempotent M1 catalog seed: 5 leagues, 14 clubs, multilingual aliases,
-- and 19 verified official website identities. Website collection remains disabled.

insert into public.leagues (
  id, slug, name_zh, name_en, country_code, display_order, active
)
values
  ('10000000-0000-4000-8000-000000000001', 'premier-league', '英格兰足球超级联赛', 'Premier League', 'GB', 10, true),
  ('10000000-0000-4000-8000-000000000002', 'la-liga', '西班牙足球甲级联赛', 'La Liga', 'ES', 20, true),
  ('10000000-0000-4000-8000-000000000003', 'bundesliga', '德国足球甲级联赛', 'Bundesliga', 'DE', 30, true),
  ('10000000-0000-4000-8000-000000000004', 'serie-a', '意大利足球甲级联赛', 'Serie A', 'IT', 40, true),
  ('10000000-0000-4000-8000-000000000005', 'ligue-1', '法国足球甲级联赛', 'Ligue 1', 'FR', 50, true)
on conflict (slug) do update set
  name_zh = excluded.name_zh,
  name_en = excluded.name_en,
  country_code = excluded.country_code,
  display_order = excluded.display_order,
  active = excluded.active;

insert into public.teams (
  id, league_id, slug, name_zh, name_en, short_name_zh, short_name_en,
  country_code, official_domain, display_order, active
)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'manchester-united', '曼彻斯特联足球俱乐部', 'Manchester United Football Club', '曼联', 'Manchester United', 'GB', 'manutd.com', 10, true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'liverpool', '利物浦足球俱乐部', 'Liverpool Football Club', '利物浦', 'Liverpool', 'GB', 'liverpoolfc.com', 20, true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'chelsea', '切尔西足球俱乐部', 'Chelsea Football Club', '切尔西', 'Chelsea', 'GB', 'chelseafc.com', 30, true),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'manchester-city', '曼彻斯特城足球俱乐部', 'Manchester City Football Club', '曼城', 'Manchester City', 'GB', 'mancity.com', 40, true),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'tottenham-hotspur', '托特纳姆热刺足球俱乐部', 'Tottenham Hotspur Football Club', '热刺', 'Tottenham Hotspur', 'GB', 'tottenhamhotspur.com', 50, true),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'arsenal', '阿森纳足球俱乐部', 'Arsenal Football Club', '阿森纳', 'Arsenal', 'GB', 'arsenal.com', 60, true),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'real-madrid', '皇家马德里足球俱乐部', 'Real Madrid Club de Fútbol', '皇马', 'Real Madrid', 'ES', 'realmadrid.com', 10, true),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'barcelona', '巴塞罗那足球俱乐部', 'Futbol Club Barcelona', '巴萨', 'Barcelona', 'ES', 'fcbarcelona.com', 20, true),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'bayern-munich', '拜仁慕尼黑足球俱乐部', 'Fußball-Club Bayern München', '拜仁', 'Bayern Munich', 'DE', 'fcbayern.com', 10, true),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'borussia-dortmund', '多特蒙德足球俱乐部', 'Ballspielverein Borussia 09 Dortmund', '多特', 'Borussia Dortmund', 'DE', 'bvb.de', 20, true),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'juventus', '尤文图斯足球俱乐部', 'Juventus Football Club', '尤文', 'Juventus', 'IT', 'juventus.com', 10, true),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'inter-milan', '国际米兰足球俱乐部', 'Football Club Internazionale Milano', '国米', 'Inter Milan', 'IT', 'inter.it', 20, true),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000005', 'paris-saint-germain', '巴黎圣日耳曼足球俱乐部', 'Paris Saint-Germain Football Club', '巴黎', 'Paris Saint-Germain', 'FR', 'psg.fr', 10, true),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000005', 'marseille', '马赛奥林匹克足球俱乐部', 'Olympique de Marseille', '马赛', 'Marseille', 'FR', 'om.fr', 20, true)
on conflict (slug) do update set
  league_id = excluded.league_id,
  name_zh = excluded.name_zh,
  name_en = excluded.name_en,
  short_name_zh = excluded.short_name_zh,
  short_name_en = excluded.short_name_en,
  country_code = excluded.country_code,
  official_domain = excluded.official_domain,
  display_order = excluded.display_order,
  active = excluded.active;

insert into public.team_aliases (team_id, alias, language_code, alias_type)
values
  ('20000000-0000-4000-8000-000000000001', 'Manchester United', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000001', 'Man United', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000001', 'Man Utd', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000001', '曼联', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000002', 'Liverpool', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000002', 'Liverpool FC', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000002', 'LFC', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000002', '利物浦', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000003', 'Chelsea', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000003', 'Chelsea FC', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000003', 'CFC', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000003', '切尔西', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000004', 'Manchester City', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000004', 'Man City', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000004', 'MCFC', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000004', '曼城', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000005', 'Tottenham Hotspur', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000005', 'Tottenham', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000005', 'Spurs', 'en', 'nickname'),
  ('20000000-0000-4000-8000-000000000005', '热刺', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000006', 'Arsenal', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000006', 'Arsenal FC', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000006', 'Gunners', 'en', 'nickname'),
  ('20000000-0000-4000-8000-000000000006', '阿森纳', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000007', 'Real Madrid', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000007', 'Real Madrid CF', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000007', '皇家马德里', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000007', '皇马', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000008', 'Barcelona', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000008', 'FC Barcelona', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000008', 'Barça', 'en', 'nickname'),
  ('20000000-0000-4000-8000-000000000008', '巴塞罗那', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000008', '巴萨', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000009', 'Bayern Munich', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000009', 'FC Bayern München', 'de', 'official'),
  ('20000000-0000-4000-8000-000000000009', 'Bayern', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000009', '拜仁慕尼黑', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000009', '拜仁', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000010', 'Borussia Dortmund', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000010', 'Dortmund', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000010', 'BVB', 'de', 'short'),
  ('20000000-0000-4000-8000-000000000010', '多特蒙德', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000010', '多特', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000011', 'Juventus', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000011', 'Juventus FC', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000011', 'Juve', 'it', 'nickname'),
  ('20000000-0000-4000-8000-000000000011', '尤文图斯', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000011', '尤文', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000012', 'Inter Milan', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000012', 'Internazionale', 'it', 'official'),
  ('20000000-0000-4000-8000-000000000012', 'Inter', 'it', 'short'),
  ('20000000-0000-4000-8000-000000000012', '国际米兰', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000012', '国米', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000013', 'Paris Saint-Germain', 'en', 'official'),
  ('20000000-0000-4000-8000-000000000013', 'PSG', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000013', 'Paris SG', 'en', 'common'),
  ('20000000-0000-4000-8000-000000000013', '巴黎圣日耳曼', 'zh-CN', 'official'),
  ('20000000-0000-4000-8000-000000000013', '巴黎', 'zh-CN', 'short'),
  ('20000000-0000-4000-8000-000000000014', 'Olympique de Marseille', 'fr', 'official'),
  ('20000000-0000-4000-8000-000000000014', 'Marseille', 'en', 'short'),
  ('20000000-0000-4000-8000-000000000014', 'OM', 'fr', 'short'),
  ('20000000-0000-4000-8000-000000000014', '马赛', 'zh-CN', 'official')
on conflict (team_id, language_code, normalized_alias) do update set
  alias = excluded.alias,
  alias_type = excluded.alias_type;

insert into public.sources (
  id, slug, name, country_code, source_type, homepage_url, access_method,
  access_status, is_official, identity_verified, default_reliability,
  rights_notes, last_reviewed_at, collection_enabled, active
)
values
  ('30000000-0000-4000-8000-000000000001', 'premier-league-official', 'Premier League Official', 'GB', 'league_official', 'https://www.premierleague.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000002', 'la-liga-official', 'LALIGA Official', 'ES', 'league_official', 'https://www.laliga.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000003', 'bundesliga-official', 'Bundesliga Official', 'DE', 'league_official', 'https://www.bundesliga.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000004', 'serie-a-official', 'Lega Serie A Official', 'IT', 'league_official', 'https://www.legaseriea.it/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000005', 'ligue-1-official', 'Ligue 1 Official', 'FR', 'league_official', 'https://ligue1.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000006', 'manchester-united-official', 'Manchester United Official', 'GB', 'club_official', 'https://www.manutd.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000007', 'liverpool-official', 'Liverpool FC Official', 'GB', 'club_official', 'https://www.liverpoolfc.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；Media Watch 等转载内容不能因域名官方而自动标绿。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000008', 'chelsea-official', 'Chelsea FC Official', 'GB', 'club_official', 'https://www.chelseafc.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000009', 'manchester-city-official', 'Manchester City Official', 'GB', 'club_official', 'https://www.mancity.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000010', 'tottenham-hotspur-official', 'Tottenham Hotspur Official', 'GB', 'club_official', 'https://www.tottenhamhotspur.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000011', 'arsenal-official', 'Arsenal Official', 'GB', 'club_official', 'https://www.arsenal.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000012', 'real-madrid-official', 'Real Madrid Official', 'ES', 'club_official', 'https://www.realmadrid.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000013', 'barcelona-official', 'FC Barcelona Official', 'ES', 'club_official', 'https://www.fcbarcelona.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000014', 'bayern-munich-official', 'FC Bayern Official', 'DE', 'club_official', 'https://fcbayern.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000015', 'borussia-dortmund-official', 'Borussia Dortmund Official', 'DE', 'club_official', 'https://www.bvb.de/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000016', 'juventus-official', 'Juventus Official', 'IT', 'club_official', 'https://www.juventus.com/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000017', 'inter-milan-official', 'Inter Official', 'IT', 'club_official', 'https://www.inter.it/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000018', 'paris-saint-germain-official', 'Paris Saint-Germain Official', 'FR', 'club_official', 'https://www.psg.fr/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true),
  ('30000000-0000-4000-8000-000000000019', 'marseille-official', 'Olympique de Marseille Official', 'FR', 'club_official', 'https://www.om.fr/', 'manual', 'manual_only', true, true, 'unverified', '官方域名身份已核验；HTML 自动采集未获生产批准，仅允许人工录入元数据和原文链接。', '2026-08-06', false, true)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  source_type = excluded.source_type,
  homepage_url = excluded.homepage_url,
  access_method = excluded.access_method,
  access_status = excluded.access_status,
  is_official = excluded.is_official,
  identity_verified = excluded.identity_verified,
  default_reliability = excluded.default_reliability,
  rights_notes = excluded.rights_notes,
  last_reviewed_at = excluded.last_reviewed_at,
  collection_enabled = excluded.collection_enabled,
  active = excluded.active;

insert into public.source_accounts (
  id, source_id, team_id, league_id, platform, profile_url,
  verification_method, verified_at, active
)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', null, '10000000-0000-4000-8000-000000000001', 'website', 'https://www.premierleague.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', null, '10000000-0000-4000-8000-000000000002', 'website', 'https://www.laliga.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', null, '10000000-0000-4000-8000-000000000003', 'website', 'https://www.bundesliga.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', null, '10000000-0000-4000-8000-000000000004', 'website', 'https://www.legaseriea.it/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', null, '10000000-0000-4000-8000-000000000005', 'website', 'https://ligue1.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', null, 'website', 'https://www.manutd.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', null, 'website', 'https://www.liverpoolfc.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', null, 'website', 'https://www.chelseafc.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000004', null, 'website', 'https://www.mancity.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000005', null, 'website', 'https://www.tottenhamhotspur.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000006', null, 'website', 'https://www.arsenal.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000007', null, 'website', 'https://www.realmadrid.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000008', null, 'website', 'https://www.fcbarcelona.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000009', null, 'website', 'https://fcbayern.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000010', null, 'website', 'https://www.bvb.de/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000011', null, 'website', 'https://www.juventus.com/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000017', '30000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000012', null, 'website', 'https://www.inter.it/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000018', '30000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000013', null, 'website', 'https://www.psg.fr/', 'manual_review', '2026-08-06T00:00:00Z', true),
  ('40000000-0000-4000-8000-000000000019', '30000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000014', null, 'website', 'https://www.om.fr/', 'manual_review', '2026-08-06T00:00:00Z', true)
on conflict (source_id, platform, profile_url) do update set
  team_id = excluded.team_id,
  league_id = excluded.league_id,
  verification_method = excluded.verification_method,
  verified_at = excluded.verified_at,
  active = excluded.active;

do $$
begin
  if (select count(*) from public.leagues where id::text like '10000000-0000-4000-8000-%') <> 5 then
    raise exception 'M1 seed expected 5 leagues';
  end if;

  if (select count(*) from public.teams where id::text like '20000000-0000-4000-8000-%') <> 14 then
    raise exception 'M1 seed expected 14 teams';
  end if;

  if (select count(*) from public.team_aliases where team_id::text like '20000000-0000-4000-8000-%') <> 62 then
    raise exception 'M1 seed expected 62 team aliases';
  end if;

  if (select count(*) from public.sources where id::text like '30000000-0000-4000-8000-%') <> 19 then
    raise exception 'M1 seed expected 19 official sources';
  end if;

  if (select count(*) from public.source_accounts where id::text like '40000000-0000-4000-8000-%') <> 19 then
    raise exception 'M1 seed expected 19 official source accounts';
  end if;
end;
$$;
