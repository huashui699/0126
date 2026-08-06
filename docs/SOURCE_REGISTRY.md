# 0126 Football 首批 14 支球队与消息来源登记表

> 文档版本：v1.1<br>
> 核对日期：2026-08-06<br>
> 用途：MVP 球队初始化、采集器开发、来源可信度配置与运营审核

## 1. 选队原则

首批球队覆盖五大联赛，共 14 支：西甲、德甲、意甲和法甲各 2 支，英超扩展为 6 支。选择标准：

- 具有公认的历史地位或持续的顶级竞争力。
- 在本国和国际市场拥有较高球迷关注度。
- 官方内容更新稳定，具备官网、官方视频或社交渠道。
- 能覆盖不同语言和媒体生态，用于验证多语言采集与 AI 摘要能力。
- MVP 控制在 14 队；英超按用户要求增加切尔西、曼城、热刺和阿森纳，同时保持其他四个联赛各 2 支。

## 2. 首批 14 支球队

| 联赛 | 球队 | 中文简称 | 建议 `team_slug` | 首期优先级 |
|---|---|---|---|---:|
| 英格兰超级联赛 | Manchester United | 曼联 | `manchester-united` | P0 |
| 英格兰超级联赛 | Liverpool FC | 利物浦 | `liverpool` | P0 |
| 英格兰超级联赛 | Chelsea FC | 切尔西 | `chelsea` | P0 |
| 英格兰超级联赛 | Manchester City | 曼城 | `manchester-city` | P0 |
| 英格兰超级联赛 | Tottenham Hotspur | 托特纳姆热刺 / 热刺 | `tottenham-hotspur` | P0 |
| 英格兰超级联赛 | Arsenal FC | 阿森纳 | `arsenal` | P0 |
| 西班牙甲级联赛 | Real Madrid CF | 皇家马德里 / 皇马 | `real-madrid` | P0 |
| 西班牙甲级联赛 | FC Barcelona | 巴塞罗那 / 巴萨 | `barcelona` | P0 |
| 德国甲级联赛 | FC Bayern München | 拜仁慕尼黑 / 拜仁 | `bayern-munich` | P0 |
| 德国甲级联赛 | Borussia Dortmund | 多特蒙德 / 多特 | `borussia-dortmund` | P0 |
| 意大利甲级联赛 | Juventus FC | 尤文图斯 / 尤文 | `juventus` | P0 |
| 意大利甲级联赛 | FC Internazionale Milano | 国际米兰 / 国米 | `inter-milan` | P0 |
| 法国甲级联赛 | Paris Saint-Germain | 巴黎圣日耳曼 / 巴黎 | `paris-saint-germain` | P0 |
| 法国甲级联赛 | Olympique de Marseille | 马赛 | `olympique-marseille` | P0 |

## 3. 官方消息源

### 3.1 球队官方来源

| 球队 | 官方新闻页 | 官方 YouTube | 官方 X 主账号 | 接入建议 |
|---|---|---|---|---|
| 曼联 | [Manchester United Latest News](https://www.manutd.com/en/news?lang=en) | [@manutd](https://www.youtube.com/@manutd) | [@ManUtd](https://x.com/ManUtd) | 官网 Adapter + YouTube API；X 后期按量接入 |
| 利物浦 | [Liverpool FC News](https://www.liverpoolfc.com/news) | [@LiverpoolFC](https://www.youtube.com/@LiverpoolFC) | [@LFC](https://x.com/LFC) | 官网 Adapter + YouTube API；排除 `Media watch` 的绿色判定 |
| 切尔西 | [Chelsea FC News](https://www.chelseafc.com/en/news) | [@chelseafc](https://www.youtube.com/@chelseafc) | [@ChelseaFC](https://x.com/ChelseaFC) | 官网 Adapter + YouTube API；优先 Men、Transfers 与 Club Statement |
| 曼城 | [Manchester City News](https://www.mancity.com/en/news) | [@mancity](https://www.youtube.com/@mancity) | [@ManCity](https://x.com/ManCity) | 官网 Adapter + YouTube API；优先 Men's Team、Team News 与 Club News |
| 托特纳姆热刺 | [Tottenham Hotspur News](https://www.tottenhamhotspur.com/news/) | [@TottenhamHotspur](https://www.youtube.com/@TottenhamHotspur) | [@SpursOfficial](https://x.com/SpursOfficial) | 官网 Adapter + YouTube API；区分新闻、票务与 SPURSPLAY 内容 |
| 阿森纳 | [Arsenal News](https://www.arsenal.com/news) | [@arsenal](https://www.youtube.com/@arsenal) | [@Arsenal](https://x.com/Arsenal) | 官网 Adapter + YouTube API；官网存在访问限制，先完成条款与技术验证 |
| 皇家马德里 | [Real Madrid Football News](https://www.realmadrid.com/en-US/news/football) | [@realmadrid](https://www.youtube.com/@realmadrid) | [@realmadrid](https://x.com/realmadrid) | 官网 Adapter；识别 `Official Announcement` 内容类型 |
| 巴塞罗那 | [FC Barcelona First Team News](https://www.fcbarcelona.com/en/football/first-team/news) | [@FCBarcelona](https://www.youtube.com/@FCBarcelona) | [@FCBarcelona](https://x.com/FCBarcelona) | 官网 Adapter + YouTube API |
| 拜仁慕尼黑 | [FC Bayern News](https://fcbayern.com/en/news) | [@fcbayern](https://www.youtube.com/@fcbayern) | [@FCBayern](https://x.com/FCBayern) | 官网 Adapter；同时纳入一线队 24/7 官方动态页 |
| 多特蒙德 | [BVB News Overview](https://www.bvb.de/de/en/news/news-overview.html) | [@BVB](https://www.youtube.com/@BVB) | [@BVB](https://x.com/BVB) | 官网页面依赖动态数据，先做接口/条款技术验证 |
| 尤文图斯 | [Juventus Latest News](https://www.juventus.com/en/news/) | [@juventus](https://www.youtube.com/@juventus) | [@juventusfc](https://x.com/juventusfc) | 官网 Adapter；按 First Team/Transfer/Medical 分类 |
| 国际米兰 | [Inter Latest News](https://www.inter.it/en/news) | [@Inter](https://www.youtube.com/@Inter) | [@Inter](https://x.com/Inter) | 官网 Adapter；优先 Team 与 Transfer News 分类 |
| 巴黎圣日耳曼 | [PSG First Team News](https://www.psg.fr/en/teams/first-team/news) | [@PSG](https://www.youtube.com/@PSG) | [@PSG_inside](https://x.com/PSG_inside) | 官网 Adapter + Pressroom + YouTube API |
| 马赛 | [OM News](https://www.om.fr/en/news) | [@OM](https://www.youtube.com/@OM) | [@OM_Officiel](https://x.com/OM_Officiel) | 官网 Adapter；优先 1st Team 与 The Club 分类 |

重要：社交平台 Handle 可能变化。写入生产数据库前，必须从球队官网的官方社交链接再次验证，并保存不可变的 YouTube `channel_id`、X `user_id`，不能只依赖显示名称或 Handle。

### 3.2 联赛官方来源

| 联赛 | 官方消息页 | 用途 | 默认标签 |
|---|---|---|---|
| Premier League | [Latest News & Features](https://www.premierleague.com/en/news) | 赛程、规则、纪律、联赛公告、比赛报告 | 与联赛自身事项相关时为绿色 |
| LALIGA | [Latest LALIGA News](https://www.laliga.com/en-GB/news) | 赛程、规则、官方统计、赛事公告 | 与联赛自身事项相关时为绿色 |
| Bundesliga | [Bundesliga News](https://www.bundesliga.com/en/bundesliga/news) | 赛程、比赛报告、联赛官方内容 | 与联赛自身事项相关时为绿色 |
| Lega Serie A | [Official News](https://en.legaseriea.it/news) | 赛程、规则、纪律、赛事公告 | 与联赛自身事项相关时为绿色 |
| Ligue 1 / LFP | [Ligue 1 Articles](https://ligue1.com/en/articles?categoryId=6&competition=ligue1mcdonalds) | 赛程、赛事公告、比赛与阵容信息 | 与联赛自身事项相关时为绿色 |

联赛官方来源不能自动确认俱乐部转会传闻。只有当联赛页面直接发布或登记某项事实时，该具体声明才能标为绿色。

## 4. 各国主流体育媒体来源

以下每个国家选择 2 家全国性、影响力较高且足球报道稳定的主流体育媒体。这里的“主流”是项目来源选择，不代表对实时访问量做绝对排名。

| 国家 | 媒体 | 足球入口 | Feed / 接入状态 | 默认标签 |
|---|---|---|---|---|
| 英国 | BBC Sport | [BBC Sport Football](https://www.bbc.com/sport/football) | [BBC 官方 Sport Feeds](https://support.bbc.co.uk/platform/feeds/SportFeeds.htm)，Football RSS 可用，需遵守 Feed Terms | 蓝色 |
| 英国 | Sky Sports | [Sky Sports Football](https://www.skysports.com/football/news) | 未确认独立公开 Football RSS；优先洽谈许可/API，页面采集前做条款评估 | 蓝色 |
| 西班牙 | MARCA | [MARCA Fútbol](https://www.marca.com/futbol.html) | 存在 RSS 服务记录，但生产接入前需验证西班牙版 Feed 与机器读取条款 | 蓝色 |
| 西班牙 | Diario AS | [AS Fútbol](https://as.com/futbol/) | [AS 官方 RSS 目录](https://as.com/rss/index.html)，含足球和球队 Feed；先做条款审查 | 蓝色 |
| 德国 | kicker | [kicker Fußball](https://www.kicker.de/fussball) | [kicker 官方 RSS 说明](https://www.kicker.de/mit_rss_immer_informiert-371919/artikel)，提供联赛及球队 Feed/OPML | 蓝色 |
| 德国 | SPORT BILD | [SPORT BILD Fußball](https://sportbild.bild.de/fussball/) | [SPORT BILD RSS 说明](https://sportbild.bild.de/services/rss/sportbild-channel-struktur/rss-infoseite-10186584.sport.html)，上线前验证 Feed 现状与许可 | 蓝色 |
| 意大利 | La Gazzetta dello Sport | [Gazzetta Calcio](https://www.gazzetta.it/Calcio/) | [Gazzetta 官方 RSS 目录](https://www.gazzetta.it/rss/)，含 Calcio、Serie A、转会等 Feed | 蓝色 |
| 意大利 | Sky Sport Italia | [Sky Sport Calcio](https://sport.sky.it/calcio) | 未确认公开 RSS；优先许可/API，页面采集前做条款评估 | 蓝色 |
| 法国 | L'Équipe | [L'Équipe Football](https://www.lequipe.fr/Football/) | [L'Équipe RSS 页面](https://www.lequipe.fr/page/about/rssfeeds)；商业/集体展示权需要单独确认 | 蓝色 |
| 法国 | RMC Sport | [RMC Sport Football](https://rmcsport.bfmtv.com/football/) | 未确认官方公开 RSS；优先许可/API，页面采集前做条款评估 | 蓝色 |

### 4.1 为什么媒体默认是蓝色

- 主流媒体有编辑审核并不等于其报道已获当事俱乐部确认。
- 媒体可能报道转会接触、谈判或匿名消息源，这些应保持“待核实”。
- 同一媒体引用另一家媒体不算独立佐证。
- 两家媒体都引用同一名记者或同一通讯社时，只计算为一个原始来源。
- 当俱乐部随后官宣时，事件簇升级为绿色，并保留媒体首次报道时间线。

## 5. 官方来源也不能全部标绿

绿色判断必须作用于“具体声明”，不能只看域名。

以下可标绿色：

- 俱乐部发布的签约、续约、离队或伤病正式公告。
- 官方比赛阵容、比赛结果、赛程变更和纪律通知。
- 教练、球员或管理层的直接发布会原话，且引用完整可追溯。
- 联赛、足协或赛事组织方对自身管理事项的正式声明。

以下即使出现在官方站点也不能自动标绿：

- Liverpool 等俱乐部官网的 `Media watch`、媒体转载或传闻汇总。
- 俱乐部对外部报道的模糊转述。
- 赞助内容、观点文章和球迷投票。
- 球员个人账号谈论另一名球员转会的猜测。

## 6. 接入状态定义

| 状态 | 定义 | 是否进入自动采集 |
|---|---|---|
| `approved_feed` | 官方明确提供 RSS/API，条款允许当前用途 | 是 |
| `technical_review` | 来源确认，但需要验证动态接口、robots、频率和稳定性 | 测试环境可以，生产前审批 |
| `rights_review` | RSS/页面存在，但商业或集体展示权不明确 | 否，先确认授权 |
| `paid_api` | 需要付费 API 或平台配额 | 预算批准后接入 |
| `manual_only` | 只能由运营人员录入链接和必要摘要 | 是，人工方式 |
| `blocked` | 条款禁止、技术封锁或风险不可接受 | 否 |

## 7. 建议的第一批实际接入顺序

### Wave 1：官方底座

1. 14 支球队官网新闻页。
2. 5 个联赛官方新闻页。
3. 14 支球队官方 YouTube 频道，通过 YouTube Data API 读取新视频元数据。

进入开发前，对每个官网完成：robots 检查、服务条款检查、更新频率测试、页面/API 结构记录。若不允许自动采集，则改为官方邮件、RSS、API、授权或人工录入。

### Wave 2：有明确 Feed 入口的媒体

1. BBC Sport Football。
2. Diario AS Football/球队 Feed。
3. kicker Football/球队 Feed。
4. La Gazzetta dello Sport Calcio/Serie A Feed。
5. L'Équipe Football Feed——仅在使用权确认后启用。

### Wave 3：需授权或技术验证的媒体

- Sky Sports、MARCA、SPORT BILD、Sky Sport Italia、RMC Sport。
- 先作为人工选稿源，不在未确认条款时部署页面爬虫。

### Wave 4：社交平台

- X：只跟踪球队官方账号与人工审核的记者名单；采用官方 API 并设置月度预算上限。
- YouTube：使用官方 Data API 与固定 `channel_id`，避免高成本全网搜索。
- Instagram、TikTok、微博、抖音和微信公众号：等待开放接口、展示许可和缓存规则确认。

## 8. 数据库初始化建议

### 8.1 `sources` 示例字段

```text
id
name
country_code
source_type            # club_official / league_official / media / journalist / community
homepage_url
feed_url
access_method          # rss / api / html / manual
access_status
is_official
default_reliability
rights_notes
last_reviewed_at
active
```

### 8.2 `source_accounts` 示例字段

```text
id
source_id
team_id
platform               # website / youtube / x / instagram ...
handle
platform_account_id    # 使用稳定 ID，不只使用 Handle
profile_url
verification_method    # official_site_link / platform_verified / manual_review
verified_at
active
```

## 9. 上线前来源验收清单

每个来源必须完成以下检查后才能设为 `active = true`：

- 来源主体与域名/账号归属已验证。
- 明确采集方式、请求频率和失败重试策略。
- 已确认 robots、服务条款、RSS/API 条款与展示限制。
- 已记录允许保存的字段、缓存期限和删除要求。
- 能稳定取得标题、URL、发布时间、作者/来源和必要摘要。
- 相同内容重复拉取不会产生重复数据。
- 媒体内容默认蓝色；只有符合硬规则的官方具体声明可为绿色。
- 来源失效、结构变化或配额不足时能够告警并停用。

## 10. 本轮结论

首批 14 队和 33 个官方核心入口（14 个球队官网、14 个官方 YouTube、5 个联赛官网）已经确定；同时建立 10 家主流体育媒体候选池。

开发阶段不应一次接入全部来源。建议先完成 14 个球队和 5 个联赛的来源模型，再挑选 4–5 个权利边界较清楚的 RSS 进行自动采集。这样可以先验证球队匹配、去重、AI 摘要、日历展示和可信度流转，再逐步扩大媒体与社交平台覆盖。
