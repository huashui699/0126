# Day 25 项目目标偏差审计

> 审计日期：2026-08-08  
> 审计范围：Day 21–25 安全采集骨架  
> 依据：[V1 项目基线](./V1_PROJECT_BASELINE_2026-08-08.md)、[项目计划](./PROJECT_PLAN.md)、[需求追踪矩阵](./REQUIREMENTS_TRACEABILITY.md)

## 1. 结论

**GO：可以进入 Day 26–30，没有发现项目目标偏离。**

本阶段只实现模拟 Adapter、统一规范化、日志/运行记录、重试、幂等、失败隔离、数据库来源门禁和受保护调度入口。没有接入任何真实 RSS、官网或社交来源，没有新增登录注册，也没有扩大 14 队和最多 5 队的产品范围。

数据库迁移在本次审计时仍属于“仓库完成、待远端应用”；因此 Day 21–25 不标记为 Production 已上线。

## 2. 六项强制核对

| 核对项 | 证据 | 结论 |
|---|---|---|
| 固定 14 队、最多选择 5 队 | `lib/teams.ts` 保持 14 队；`CalendarView` 仍为 `MAX_TEAMS = 5` | 通过 |
| 未引入未经批准的真实来源 | 当前唯一可直接实例化的运行入口使用 `MockFeedAdapter`；真实 Adapter 必须通过来源权限查询 | 通过 |
| 模拟数据未冒充生产能力 | Run、raw 和 news 均有 `is_simulated`；模拟来源不能绑定 `source_id`；UI 文案含“明确模拟” | 通过 |
| 未新增账号或范围外页面 | 仅新增内部 `/api/ingestion/run` 与 `/api/ingestion/health`；无登录注册页面变更 | 通过 |
| 代码、测试、数据和 Preview 证据 | 代码、migration、7 项单元测试、构建已具备；Preview/远端迁移待最终联合验证 | 部分完成，不构成方向偏差 |
| 未提交改动与阻塞已记录 | 当前改动尚未提交；本机数据库测试依赖 Docker，远端 migration 尚未应用 | 已记录 |

## 3. Day 21–25 验收映射

| Day | 交付物 | 当前证据 | 状态 |
|---:|---|---|---|
| 21 | `raw_items`、Adapter、规范化和哈希 | migration；`types.ts`、`normalize.ts`、Adapters | 仓库完成 |
| 22 | `ingestion_runs`、调度、超时、重试和幂等 | runner、Vercel Cron、运行表与唯一幂等键 | 仓库完成 |
| 23 | 来源启用与权利门禁 | 应用层预检 + 数据库 trigger；拒绝路径测试通过 | 仓库完成 |
| 24 | 结构化错误、失败隔离 | 运行计数/错误字段；隔离批处理测试通过 | 仓库完成 |
| 25 | 模拟 Feed 端到端闭环 | mock raw → normalize → news 候选测试通过，2 条均显式模拟 | 仓库完成 |

## 4. 已通过检查

- 采集单元测试：7/7。
- ESLint：通过。
- TypeScript：通过。
- Next.js 生产构建：通过。
- 新路由：`/api/ingestion/run`、`/api/ingestion/health` 均为 Node.js 动态 Route Handler。

## 5. 进入 Day 26–30 的限制

1. 14 个俱乐部官网只能归类为已批准、待授权、人工录入或禁用。
2. 当前批准来源数仍为 0，因此 Day 27 使用合成 JSON 契约测试，不得声称真实 Feed 已接入。
3. 不得启用 `collection_enabled`，除非来源同时满足权利批准、身份验证、启用状态和批准 Adapter 分类。
4. Day 30 只能报告来源健康结构已完成；没有真实运行的来源不得显示为健康或成功。
