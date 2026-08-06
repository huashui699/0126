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

1. 在 Supabase 项目的 SQL Editor 中执行 `supabase/migrations/202608060001_create_news.sql`。
2. 打开 Supabase 项目的 **Connect** 面板，复制 Project URL 与 Publishable key。
3. 在 `.env.local` 或 Vercel Project Settings → Environment Variables 中设置：

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
- 后续：RSS 抓取、AI 翻译与摘要、真实筛选、球队关注、后台管理。
