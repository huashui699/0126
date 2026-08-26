# 0126 Football

面向中国球迷的足球新闻聚合站 V1。当前版本以响应式情报日历为入口，支持球队筛选、新闻详情与可信度解释、Supabase 真实新闻读取、安全预览降级、官方来源采集、AI 处理骨架和运营复核工具。

## 当前状态（2026-08-25）

- 已合并生产采集修复；英超、利物浦和阿森纳三个官方来源已获产品负责人批准进行仅元数据发现，正文仍保留在发布方网站。
- Supabase 正常时展示真实数据；未配置或列表查询失败时展示明确标记的验收 fixture。fixture 详情在网络故障时保持可读，真实不存在的新闻仍返回空状态。
- 本地确定性 E2E：桌面与移动端 28/28 通过并可干净退出；本地直连真实 Supabase 的只读 smoke：4/4 通过。
- ESLint、TypeScript、采集与智能单元测试、Next.js 生产构建均通过。
- 尚未达到生产发布门禁：300 条人工裁决、高数据量、完整无障碍/4G 性能、远端安全回滚和连续 7 天回放仍待完成。

## 本地启动

要求 Node.js 20.9 或更高版本。

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

然后打开 <http://localhost:3000>。

## 连接 Supabase

1. 使用 Supabase CLI 从 `supabase/migrations/` 顺序执行数据库迁移；不要在生产 SQL Editor 中制造未进入版本控制的结构变更。
2. 在本地/Preview 执行 `supabase db reset` 和 `supabase test db`，确认 migration、seed 与 RLS 测试通过后再推送生产。
3. 打开 Supabase 项目的 **Connect** 面板，复制 Project URL 与 Publishable key。
4. 在 `.env.local` 或 Vercel Project Settings → Environment Variables 中设置：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

不要把 secret key 或 service role key 写入任何 `NEXT_PUBLIC_` 环境变量。

## 检查命令

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## V1 范围

- 已完成（产品主路径）：月历/周视图、14 队选择与本地保存、当天摘要、新闻详情、来源追溯、可信度解释和响应式适配。
- 已完成（工程）：采集 Adapter、调度/幂等/健康状态、AI 结构化处理与忠实度门禁、可信度硬规则、状态历史、标注台和运营复核后台。
- 已接入（受控真实来源）：英超、利物浦、阿森纳的仅元数据发现；其他来源继续保持关闭，直至逐项完成授权和技术审核。
- 延后：登录与跨设备关注同步、通知、低可信社区来源和红色传闻自动采集。
- 发布前待办：真实人工质量评测、远端安全与恢复证据、高数据量/无障碍/性能门禁、连续 7 天 Preview 回放。

完整进度与生产门禁见 [每日交付日历](docs/DELIVERY_CALENDAR.md)、[M1 数据底座评审](docs/M1_DATABASE_REVIEW_2026-08-07.md) 和 [数据库运行手册](docs/DATABASE_RUNBOOK.md)。
