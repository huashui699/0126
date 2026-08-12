# 14 队来源实施复核（Day 26–30）

> 复核日期：2026-08-08  
> 依据：[来源审核](./SOURCE_AUDIT_2026-08-06.md)与 [V1 项目基线](./V1_PROJECT_BASELINE_2026-08-08.md)  
> 结论：当前没有可直接用于生产自动采集的俱乐部来源；14 队均保持 `manual_only`，不得启用自动任务。

## 1. 逐队结论

| 联赛 | 球队 | 来源 slug | 技术结论 | 权利结论 | 当前分类 | Day 27–30 行动 |
|---|---|---|---|---|---|---|
| 英超 | 曼联 | `manchester-united-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 保留契约测试，不抓 HTML |
| 英超 | 利物浦 | `liverpool-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | Media Watch 不得自动标绿 |
| 英超 | 切尔西 | `chelsea-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 保留原文链接和必要元数据 |
| 英超 | 曼城 | `manchester-city-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 等待官方 Feed/API 许可 |
| 英超 | 热刺 | `tottenham-hotspur-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 不绕过页面限制 |
| 英超 | 阿森纳 | `arsenal-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 用模拟 Feed 验证球队匹配 |
| 西甲 | 皇马 | `real-madrid-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 用合成 JSON 验证 Adapter 契约 |
| 西甲 | 巴萨 | `barcelona-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 等待可商用 Feed/API |
| 德甲 | 拜仁 | `bayern-munich-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 只保留来源身份 |
| 德甲 | 多特 | `borussia-dortmund-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 别名 `BVB` 纳入基准测试 |
| 意甲 | 尤文 | `juventus-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 别名 `Juve` 纳入基准测试 |
| 意甲 | 国米 | `inter-milan-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 中英文别名纳入基准测试 |
| 法甲 | 巴黎 | `paris-saint-germain-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 别名 `PSG` 纳入基准测试 |
| 法甲 | 马赛 | `marseille-official` | 官网身份已验证 | 未取得自动采集许可 | 人工录入 | 短别名 `OM` 只做词边界匹配 |

## 2. Day 27 等价契约验收

由于批准来源数为 0，本阶段不制造“第一个真实 Feed 已接入”的假象，使用 `ApprovedJsonFeedAdapter` 和注入式合成响应完成等价契约测试：

- 必填：稳定外部 ID、HTTP(S) 原文 URL、标题、发布时间。
- 可选：短摘要、正文摘录、作者、球队提示。
- 输出：规范化 URL、UTC 时间、SHA-256 内容哈希、球队 ID 和完整原始 JSON。
- 放行：只有来源同时满足批准状态、身份验证、启用状态和 `approved_adapter` 分类时，运行器及数据库才允许真实任务写入。

## 3. Day 28–30 数据质量结果

| Day | 能力 | 结果 |
|---:|---|---|
| 28 | URL 规范化、去重、停用处理 | 移除跟踪参数/片段；外部 ID 与规范化 URL 双唯一；停用来源在运行前和数据库写入前均被拒绝 |
| 29 | 球队关键词与别名初筛 | 使用固定 14 队及别名；短别名采用词边界；一条信息可关联多队 |
| 30 | 来源健康与最近运行状态 | 服务端健康视图返回 disabled/never_run/healthy/degraded/failing/stale；未启用来源显示 disabled，不冒充健康 |

## 4. 下一步授权条件

任何来源从 `manual_only` 或 `pending_review` 升级前，必须补齐商业使用范围、缓存期限、允许保存字段、AI 摘要许可、署名方式、删除机制和联系人证据。批准后才能同时设置 `access_status`、`operational_classification`、`collection_enabled` 和 `active`；缺一项仍会被数据库门禁拒绝。
