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

insert into public.news (
  id, title, summary, content, source, url, league, team, created_at,
  published_at, event_at, info_type, trust_status, trust_reason, trust_updated_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '曼城公布公开训练安排（M3 验收样例）',
    '球队公布本周公开训练和媒体开放时间，日历按原始发布时间展示。',
    '这是用于验证日历、筛选与详情追溯的合成数据，不代表真实新闻。',
    'Manchester City Official · Fixture', 'https://www.mancity.com/', '英超', '曼城',
    '2026-08-08T01:30:00Z', '2026-08-08T01:30:00Z', null,
    'club_announcement', 'confirmed', '验收数据标记为官方渠道样例；仅验证展示规则，不用于事实判断。', '2026-08-08T01:35:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '皇马新援参加合练（M3 验收样例）',
    '多家媒体观察到新援参与合练，但俱乐部尚未发布完整名单。',
    '这是用于验证待核实状态和多球队筛选的合成数据。',
    '0126 Fixture Desk', 'https://www.realmadrid.com/', '西甲', '皇家马德里',
    '2026-08-08T03:00:00Z', '2026-08-08T03:00:00Z', null,
    'media', 'unverified', '存在明确来源，但尚无针对该细节的直接官方确认。', '2026-08-08T03:10:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '利物浦确认青年队晋升名单（M3 验收样例）',
    '俱乐部公布进入一线队训练名单的青年球员。',
    '合成验收条目，用于验证球员类信息和官方确认标签。',
    'Liverpool FC Official · Fixture', 'https://www.liverpoolfc.com/', '英超', '利物浦',
    '2026-08-07T08:00:00Z', '2026-08-07T08:00:00Z', null,
    'player', 'confirmed', '验收数据模拟俱乐部官网直接发布。', '2026-08-07T08:05:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '巴萨训练赛阵容观察（M3 验收样例）',
    '训练赛阵容来自媒体现场观察，正式比赛安排仍待官方发布。',
    '合成验收条目，用于验证过去日期和待核实状态。',
    '0126 Fixture Desk', 'https://www.fcbarcelona.com/', '西甲', '巴塞罗那',
    '2026-08-06T12:20:00Z', '2026-08-06T12:20:00Z', null,
    'coaching', 'unverified', '单一媒体观察可追溯，但缺少第二个独立来源。', '2026-08-06T12:25:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000005',
    '拜仁球迷开放日（M3 验收样例）',
    '活动将在上海时间 8 月 10 日晚举行，日历按事件时间展示。',
    '合成验收条目，用于验证 published_at 与 event_at 的区别。',
    'FC Bayern Official · Fixture', 'https://fcbayern.com/', '德甲', '拜仁慕尼黑',
    '2026-08-08T04:00:00Z', '2026-08-08T04:00:00Z', '2026-08-10T11:00:00Z',
    'social', 'confirmed', '验收数据模拟俱乐部官方活动公告，并保留独立事件时间。', '2026-08-08T04:10:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000006',
    '国际米兰季前赛安排更新（M3 验收样例）',
    '开球时间调整为上海时间 8 月 12 日凌晨。',
    '合成验收条目，用于验证未来比赛和月历计数。',
    'Inter Official · Fixture', 'https://www.inter.it/', '意甲', '国际米兰',
    '2026-08-08T05:00:00Z', '2026-08-08T05:00:00Z', '2026-08-11T18:30:00Z',
    'match', 'confirmed', '验收数据模拟俱乐部官方赛程更新。', '2026-08-08T05:05:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000007',
    '阿森纳续约谈判进展（M3 验收样例）',
    '报道表示双方继续沟通，尚无正式公告。',
    '合成验收条目，用于验证转会类筛选和待核实标签。',
    '0126 Fixture Desk', 'https://www.arsenal.com/', '英超', '阿森纳',
    '2026-08-09T02:00:00Z', '2026-08-09T02:00:00Z', null,
    'transfer', 'unverified', '报道可追溯，但俱乐部尚未确认谈判结论。', '2026-08-09T02:05:00Z'
  ),
  (
    '50000000-0000-4000-8000-000000000008',
    '巴黎公布社区活动（M3 验收样例）',
    '俱乐部球员将参加本地青训社区活动。',
    '合成验收条目，用于验证未来日期和不同联赛展示。',
    'Paris Saint-Germain Official · Fixture', 'https://www.psg.fr/', '法甲', '巴黎圣日耳曼',
    '2026-08-09T04:00:00Z', '2026-08-09T04:00:00Z', '2026-08-13T09:00:00Z',
    'club_announcement', 'confirmed', '验收数据模拟俱乐部官网直接发布的活动公告。', '2026-08-09T04:05:00Z'
  )
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  source = excluded.source,
  url = excluded.url,
  league = excluded.league,
  team = excluded.team,
  published_at = excluded.published_at,
  event_at = excluded.event_at,
  info_type = excluded.info_type,
  trust_status = excluded.trust_status,
  trust_reason = excluded.trust_reason,
  trust_updated_at = excluded.trust_updated_at;

insert into public.news_teams (news_id, team_id, relationship)
values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'subject'),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000007', 'subject'),
  ('50000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'subject'),
  ('50000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000008', 'subject'),
  ('50000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000009', 'subject'),
  ('50000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000012', 'subject'),
  ('50000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000006', 'subject'),
  ('50000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000013', 'subject')
on conflict (news_id, team_id) do update set relationship = excluded.relationship;

insert into public.event_clusters (id, canonical_title, event_at, trust_status)
values (
  '60000000-0000-4000-8000-000000000001',
  '2026 年 8 月俱乐部公开活动安排（M3 验收样例）',
  '2026-08-10T11:00:00Z',
  'confirmed'
)
on conflict (id) do update set
  canonical_title = excluded.canonical_title,
  event_at = excluded.event_at,
  trust_status = excluded.trust_status;

insert into public.cluster_items (cluster_id, news_id, is_primary)
values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000005', true),
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000008', false)
on conflict (cluster_id, news_id) do update set is_primary = excluded.is_primary;
