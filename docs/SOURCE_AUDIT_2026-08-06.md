# 0126 Football 来源准入审核表

> 版本：v1.0<br>
> 审核日期：2026-08-06<br>
> 范围：14 个俱乐部官网、5 个联赛官网、首批 5 个媒体 Feed<br>
> 结论性质：产品与技术准入审核，不构成法律意见

## 1. 审核方法与判定原则

本次逐项检查了：

- 新闻入口是否可从当前审核环境访问。
- 根域名 `robots.txt` 是否可访问，以及是否发现针对新闻路径的明确禁止。
- 官网条款、版权说明、RSS 使用说明或数据挖掘政策是否允许本项目计划的自动化与商业展示用途。
- 官方 RSS/OPML 是否真实存在、能否解析、是否仍在更新。
- 推荐接入方法和轮询频率。

重要限制：

- `robots.txt` 不是内容授权。即使允许抓取，仍需满足网站条款、版权、数据库权利和展示要求。
- 单日检查只能验证当前技术状态，不能证明长期更新频率和稳定性。
- 未发现明确授权时统一按“待授权”处理，不采用“公开可访问即允许采集”的假设。
- 自动采集只保存必要元数据、短摘要和原文链接，不复制图片、全文或完整视频字幕。

## 2. 状态定义

| 对外状态 | 内部状态 | 含义 | 生产自动采集 |
|---|---|---|---|
| 可用 | `approved_feed` / `approved_api` | 条款和技术条件明确满足当前用途 | 可以 |
| 待授权 | `rights_review` | 来源存在，但商业、聚合、AI 处理或缓存权利不明确 | 不可以 |
| 待技术验证 | `technical_review` | 权利路径可行，但接口、稳定性、动态页面或标识仍需验证 | 仅测试环境 |
| 需付费许可 | `paid_api` | 必须购买 API、内容辛迪加或商业许可 | 预算和合同批准后 |
| 仅人工 | `manual_only` | 只允许运营录入标题、链接和必要事实 | 可以，人工方式 |
| 禁用 | `blocked` | 条款、robots、失效 Feed 或技术封锁不允许当前方案 | 不可以 |

## 3. 14 个俱乐部官网审核

| 来源 | 页面/robots 实测 | 条款与权利信号 | 建议方法 | 建议检查频率 | 状态 |
|---|---|---|---|---|---|
| Manchester United | 新闻页 200；robots 200，公开路径未见禁止 | [网站条款](https://www.manutd.com/en/help/website-terms-of-use)仅授权个人非商业使用，商业利用需书面同意 | 先申请许可；未获许可前人工链接或官方 YouTube API | 获批后 15 分钟 | 待授权 |
| Liverpool FC | 新闻页 200；robots 200 | [网站条款](https://www.liverpoolfc.com/legal/terms-and-conditions/)明确禁止批量、自动或系统性提取 | 不开发 HTML Adapter；申请许可或使用官方 API/YouTube | 不轮询 HTML | 禁用（HTML） |
| Chelsea FC | 新闻页 200；robots 200 | 审核时未找到覆盖主新闻站自动聚合的明确许可 | 联系俱乐部确认；未获许可前人工链接或 YouTube API | 获批后 15 分钟 | 待授权 |
| Manchester City | 新闻页返回 403；robots 200 | [网站条款](https://www.mancity.com/terms-of-use)未授予内容聚合许可，且当前存在技术封锁 | 不绕过 403；优先申请 API/许可或 YouTube API | 不轮询 HTML | 禁用（HTML） |
| Tottenham Hotspur | 新闻页 200；robots 200 | [网站条款](https://www.tottenhamhotspur.com/information/terms-and-conditions)限定个人非商业使用，禁止未经许可复制/再发布 | 申请许可；未获许可前人工链接或 YouTube API | 获批后 15 分钟 | 待授权 |
| Arsenal FC | 新闻页在审核主机超时；robots 200 | [网站条款](https://www.arsenal.com/terms-of-use)限定个人非商业使用，并禁止超过人工浏览速度的请求 | 不开发 HTML 自动采集；优先申请许可或 YouTube API | 不轮询 HTML | 禁用（HTML） |
| Real Madrid CF | 新闻页 200；robots 200 | 未确认主新闻站对自动聚合和 AI 摘要的书面许可；相关法律页保留复制与数据库再利用权 | 申请许可；人工链接/官方 YouTube API 作为替代 | 获批后 15 分钟 | 待授权 |
| FC Barcelona | 新闻页 200；robots 200 | [内容使用条件](https://www.fcbarcelona.com/en/condiciones-de-uso-barca-tv)体现个人使用和商业利用需书面同意原则，未发现新闻 Feed 授权 | 申请许可；人工链接/YouTube API | 获批后 15 分钟 | 待授权 |
| FC Bayern München | 新闻页和 robots 在审核主机超时 | [网站条款](https://fcbayern.com/en/terms-and-conditions)仅允许个人使用，禁止商业使用和进一步复制 | 不依赖 HTML；申请许可或 YouTube API | 不轮询 HTML | 待授权 |
| Borussia Dortmund | 新闻页 200；robots 200，新闻路径未见禁止 | [网站条款](https://www.bvb.de/de/en/general/terms-of-use.html)保留全部内容权利并禁止复制/衍生使用 | 申请许可；人工链接/YouTube API | 获批后 15 分钟 | 待授权 |
| Juventus FC | 新闻页 200；robots 200 | 官方生态条款以个人非商业查看为主，未发现新闻聚合授权 | 申请许可；人工链接/YouTube API | 获批后 15 分钟 | 待授权 |
| Inter Milan | 新闻页 200；robots 200 | [Inter 条款](https://www.inter.it/en/terms-and-conditions)禁止商业使用、自动请求及机器人收集，当前页面条款范围需进一步书面确认 | 不开发 HTML Adapter；申请 API/许可或 YouTube API | 不轮询 HTML | 禁用（HTML） |
| Paris Saint-Germain | 新闻页在审核主机超时；robots 200，新闻路径未见禁止 | 未找到对主新闻站自动聚合的明确许可 | 申请许可；使用 Pressroom/YouTube 前分别审核条款 | 获批后 15 分钟 | 待授权 |
| Olympique de Marseille | 新闻页 200；robots 200，`/api/` 明确禁止 | [官网使用条款](https://www.om.fr/en/terms-of-use-for-the-om-fr-website-and-om-applications)保留站点与内容权利；未授予聚合许可 | 不调用被禁止 API；申请许可或 YouTube API | 获批后 15 分钟 | 待授权 |

审核结论：14 个官网都可以作为“官方身份与原文链接白名单”，但本轮没有任何一个 HTML 新闻入口获得生产自动采集批准。robots 未禁止不等于授权；Liverpool、Manchester City、Arsenal 和 Inter 的 HTML 自动化风险尤其明确。

## 4. 5 个联赛官网审核

| 来源 | 页面/robots 实测 | 条款与权利信号 | 建议方法 | 建议检查频率 | 状态 |
|---|---|---|---|---|---|
| Premier League | 新闻页 200；robots 200 | 未找到允许第三方商业聚合新闻内容的公开许可；赛事数据和内容权利敏感 | 联系内容/数据授权；未获许可前人工链接 | 获批后 30 分钟 | 待授权 |
| LALIGA | 新闻页 200；robots 200 | [法律条款](https://www.laliga.com/en-GB/legal/legal-web)禁止未经授权复制、分发或公开传播内容 | 申请内容/API 许可；未获许可前人工链接 | 获批后 30 分钟 | 待授权 |
| Bundesliga | 新闻页 200；robots 200 | [法律说明](https://www.bundesliga.com/en/bundesliga/info/legal-notices)限定个人、私人、非商业使用，并特别保留 AI 训练相关权利 | 申请 API/内容许可；不采集图片和全文 | 获批后 30 分钟 | 待授权 |
| Lega Serie A | 新闻页 200；robots 200 | [服务条款](https://app.legaseriea.it/oidp/service_terms?cdOrg=SERIEA&hl=it)明确禁止未经书面同意的数据挖掘和机器人提取 | 不开发 HTML Adapter；联系官方数据许可 | 不轮询 HTML | 禁用（HTML） |
| Ligue 1 / LFP | 新闻页 200；robots 200 | [使用条款](https://ligue1.com/fr/legal/cgu)仅授予查看和个人使用权 | 申请许可；未获许可前人工链接 | 获批后 30 分钟 | 待授权 |

审核结论：5 个联赛可作为官方可信度白名单，但没有一个公开网页已获生产自动采集批准。赛程、结果和纪律数据应优先寻找官方授权 API 或持牌数据商。

## 5. 首批媒体 Feed 审核

| 来源 | Feed 实测 | 官方条款结论 | 建议接入方式 | 状态 |
|---|---|---|---|---|
| BBC Sport Football | RSS 200、67 条；最新条目为 2026-08-06；官方说明可分钟级更新 | [BBC Feed 说明](https://support.bbc.co.uk/platform/feeds/SportFeeds.htm)确认 Feed 稳定，但[使用条款](https://downloads.bbc.co.uk/usingthebbc/bbc_terms_of_use_19September2022english.pdf)要求商业使用取得许可，可能收费 | 申请商业 RSS/metadata 许可；获批后 10 分钟轮询并严格署名 | 待授权 |
| Diario AS Football | RSS 200、68 条，但 `lastBuildDate` 为 2022-11-16，内容已停更 | [法律声明](https://as.com/aviso-legal/)明确保留机器读取、再利用和 AI 使用权 | 不接入该旧 Feed；如需 AS，联系 `ventacontenidos@prisamedia.com` 获取许可/API | 禁用 |
| kicker Football/Bundesliga | OPML 200；两个 Feed 均 200、各 20 条，最新为 2026-08-06 | [RSS 条款](https://www.kicker.de/nutzungsbedingungen-935291/artikel)仅允许非商业网站使用；商业内容有[付费 Syndication](https://www.kicker.de/allgemeine-geschaeftsbedingungen-content-syndication-1209934/artikel) | 申请商业 Syndication；批准后 10–15 分钟轮询 | 需付费许可 |
| La Gazzetta dello Sport Calcio | RSS 200、30 条；最新为 2026-08-06 | 官方提供 [RSS 目录](https://www.gazzetta.it/rss/)，但[数据挖掘政策](https://www.gazzetta.it/data_mining_policy.shtml)要求事先书面同意 | 申请书面许可；获批后 10–15 分钟轮询 | 待授权 |
| L'Équipe Football | RSS 200、50 条；最新为 2026-08-06 | [RSS 说明](https://www.lequipe.fr/Tous-sports/Actualites/Les-flux-rss-de-l-equipe/1299546)明确仅限个人、非专业、非集体使用；通用 robots 为 `Disallow: /` | 不用于生产自动采集；仅在取得书面授权后重新评估 | 禁用 |

审核结论：五个 Feed 技术上有四个仍活跃，但当前没有一个可以无条件进入商业产品的生产自动采集。AS Feed 还存在明确失效问题。

## 6. 准入决策与替代路径

### 6.1 当前允许

- 将 14 个俱乐部和 5 个联赛域名登记为“官方身份白名单”，只用于判断原文主体身份。
- 运营人员人工录入必要标题、短事实描述和原文链接，并记录录入人和时间。
- 在完成独立条款审核后，使用官方 YouTube Data API 获取已验证频道的公开视频元数据。
- 使用自建模拟 Feed 和种子数据开发 Adapter、去重、摘要与日历功能。

### 6.2 当前禁止

- 生产环境抓取上述俱乐部或联赛 HTML 页面。
- 绕过 403、验证码、登录、付费墙或频率限制。
- 将 AS、L'Équipe 或未经授权媒体内容送入 AI 处理。
- 保存新闻全文、图片或完整视频字幕。
- 因 robots 允许就把来源标记为 `approved_feed`。

### 6.3 商务/运营待办

1. 优先联系 BBC、kicker 和 Gazzetta，确认标题、短摘要、链接、缓存期限、AI 摘要和商业展示许可及报价。
2. 向 14 家俱乐部询问新闻 API、Pressroom Feed、媒体邮件或内容合作方式。
3. 向五大联赛询问赛程、纪律、结果和公告的官方数据/API 许可。
4. 保存书面授权、适用地域、字段范围、署名格式、删除要求和到期日。
5. 未获得书面许可时保持 `active = false`。

## 7. 对计划的影响

- Day 3 来源审核交付物已完成，但“自动采集可用来源数”为 0。
- 这不改变“官方/RSS/API 优先”的项目目标，但迫使实现路径从“直接抓网页”调整为“许可/API/人工/模拟数据”。
- Day 21–22 的采集框架可以按计划开发，并使用自建模拟 Feed 验证幂等、重试和日志。
- Day 23–25 的真实媒体接入依赖商业许可；若 Day 20 前仍无授权，应将验收物改为“持牌来源或官方 API 1–2 个 + 其余模拟 Adapter”，并记录范围变更。
- 官方网页内容仍可用于用户点击原文和人工可信度审核，但不能自动复制或批量处理。

## 8. Day 3 验收结论

14 个俱乐部官网、5 个联赛官网和首批 5 个媒体 Feed 均已标记准入状态、技术结果、权利风险、接入方式和建议频率。结果没有偏离产品的合规目标；相反，它阻止了未经授权的生产抓取。当前新增的关键依赖是商业授权与官方 API 获取。

