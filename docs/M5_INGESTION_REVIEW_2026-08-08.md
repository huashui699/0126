# M4–M5 安全采集与数据质量评审（Day 21–30）

> 评审日期：2026-08-08  
> 数据库：Supabase `football1`  
> 结论：**M4、M5 GO；进入 Day 31–35。真实来源接入仍为 0，不影响当前里程碑，但继续受授权门禁。**

## 1. 完成范围

| Day | 交付物 | 证据 | 结果 |
|---:|---|---|---|
| 21 | raw、统一 Adapter、规范化、哈希 | `raw_items`、类型契约、URL 规范化和 SHA-256 | 通过 |
| 22 | 运行记录、调度、超时、重试、幂等 | `ingestion_runs`、Vercel Cron、Runner | 通过 |
| 23 | 权利/启用门禁 | 应用预检 + 数据库 trigger；未批准来源拒绝 | 通过 |
| 24 | 日志和失败隔离 | 计数、错误码、错误摘要、`Promise.allSettled` 批隔离 | 通过 |
| 25 | 模拟 Feed 端到端回放 | run → raw → news → news_teams；记录显式模拟 | 通过 |
| 26 | 14 队技术与权利复核 | [来源实施复核](./SOURCE_IMPLEMENTATION_REVIEW_2026-08-08.md) | 通过，14 队均人工录入 |
| 27 | 首个批准 Adapter 或等价契约测试 | `ApprovedJsonFeedAdapter` 合成 JSON 契约测试 | 通过，无真实接入 |
| 28 | URL、去重、停用 | 跟踪参数清理、双唯一键、两层来源门禁 | 通过 |
| 29 | 14 队别名初筛 | 14 队逐队基准 + 多队匹配测试 | 通过 |
| 30 | 来源健康状态 | `source_health_status` 与受保护 API | 通过 |

## 2. 远端数据库证据

- 已应用 migration：`create_ingestion_pipeline`、`add_ingestion_fk_indexes`。
- `ingestion_runs`、`raw_items` 均启用 RLS，客户端角色无读取权限。
- 14 个俱乐部来源均为 `manual_only` 且 `collection_enabled=false`。
- 全部 19 个已登记来源健康状态为 `disabled`，没有把未运行来源标为健康。
- 数据库事务验证：未批准真实来源写入被拒绝；显式模拟运行允许写入。
- Day 25 持久回放：run `succeeded`、raw `normalized`、news `is_simulated=true`、1 条球队关系。

## 3. 自动测试与构建

- 采集单元测试：8 项，覆盖 URL、内容哈希、14 队匹配、模拟闭环、批次/条目幂等、未批准来源拒绝、批准源契约和失败隔离。
- 数据库 pgTAP：新增 36 项测试文件；本机仍因 Docker 缺失未运行，关键约束已在远端用事务查询复验。
- ESLint、TypeScript、Next.js 生产构建：通过。
- 原日历桌面/移动 E2E：最终联合门禁继续执行，防止采集改动影响页面。

## 4. Advisors

- 新增外键缺索引：已通过补充 migration 修复。
- 内部表 RLS 无策略：预期设计；表已 REVOKE 客户端权限且只授权 `service_role`，不增加客户端策略。
- 未使用索引：新表数据量很小且尚无生产采集流量，保留观察，不在无证据时删除约束/查询索引。
- 泄露密码保护：账号体系已延期至 V1 后，在恢复 Auth 发布前作为安全门禁处理。

## 5. 剩余阻碍

真实来源数量仍为 0。要开始生产自动采集，必须先取得明确商业/API/Feed 授权并完成来源升级证据；当前系统不会绕过该阻碍，也不会用模拟数据替代真实来源指标。
