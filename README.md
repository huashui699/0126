# 0126 Football

面向中国球迷的足球新闻聚合站 V1。当前版本包含响应式首页、Supabase 新闻读取、未配置数据库时的安全预览模式，以及适用于 Vercel 的生产构建配置。

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

- 已完成：新闻卡片、联赛标签、来源、时间、中文摘要、移动端适配、Supabase 只读接入。
- 已完成（仓库、待数据库发布）：5 联赛/14 球队目录、官方来源身份、用户资料与最多 5 队关注的数据模型、RLS、seed 和数据库测试。
- 后续：球队选择 UI、登录/游客合并、情报日历、合规采集、AI 翻译摘要与可信度规则、后台管理。

完整进度与生产门禁见 [每日交付日历](docs/DELIVERY_CALENDAR.md)、[M1 数据底座评审](docs/M1_DATABASE_REVIEW_2026-08-07.md) 和 [数据库运行手册](docs/DATABASE_RUNBOOK.md)。

