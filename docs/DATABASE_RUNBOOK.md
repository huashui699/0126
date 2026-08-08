# Supabase 数据库迁移、备份与回滚手册

> 适用范围：0126 Football<br>
> 首版日期：2026-08-07<br>
> 原则：迁移文件是唯一结构事实来源；禁止把生产 SQL Editor 的临时改动当作正式交付。

## 1. 文件约定

- `supabase/migrations/`：按顺序执行的结构迁移。
- `supabase/seed.sql`：可重复执行的目录与来源身份种子。
- `supabase/tests/database/`：pgTAP 数据库测试。
- 数据库密码、access token、service role key 和备份文件不得提交 Git。

项目已固定 Supabase CLI 2.112.0，并补齐 `supabase/config.toml`。现有 3 个 M1 迁移沿用已评审的时间戳；后续迁移必须使用 `supabase migration new <name>` 生成。

## 2. 本地/Preview 演练

前提：安装 Supabase CLI 和 Docker Desktop，并从仓库根目录执行。

```powershell
supabase --help
supabase migration --help
supabase init
supabase db reset --local
supabase test db --local supabase/tests/database
```

仓库已有 `supabase/` 时，`supabase init` 只用于补齐本地 CLI 配置；执行前先审阅其 diff，不覆盖 migration、seed 或 tests。

验收：

- reset 从空数据库完整执行所有 migration 和 seed。
- pgTAP 43 项全部通过，其中 11 项使用两个 Auth 用户验证 profile/follow 的行为级隔离。
- 连续执行两次空库 reset，结果都应为 5 联赛、14 球队、62 别名、19 来源、19 站点账号；在隔离数据库中再直接执行一次 `seed.sql`，数量不得增加。
- 匿名只能读取启用的联赛、球队和别名。
- 登录用户只能读取/更新自己的 profile 和 follows。
- `sources`、`source_accounts` 对 anon/authenticated 均不可直接读取。

## 3. 生产前备份

1. 在 Supabase Dashboard 确认最近一次平台备份状态与可恢复时间；若套餐支持 PITR，记录恢复点。
2. 在受控目录创建逻辑备份，禁止写入仓库：

```powershell
supabase db dump --linked --file <受控备份目录>\pre-m1-schema.sql
supabase db dump --linked --data-only --file <受控备份目录>\pre-m1-data.sql
```

3. 对备份文件记录 SHA-256、生成时间、项目 ref 和负责人。
4. 验证备份文件非空，并在隔离数据库执行一次恢复演练后才能迁移生产。

平台备份/PITR 能力取决于 Supabase 当前套餐；不能把“已开启备份”写成假设，必须在执行当天截图或导出证据。

## 4. 生产迁移

```powershell
supabase link --project-ref <project-ref>
supabase migration list
supabase db push --dry-run
supabase db push
```

迁移后立即执行：

- 查询 7 张 M1 表的 `relrowsecurity` 均为 true。
- 执行数据库测试。
- 验证 5/14/62/19/19 种子计数。
- 使用 anon key 验证球队目录只读；使用两个测试用户交叉验证 RLS 隔离。
- 确认所有 `collection_enabled = false`，避免未授权采集被启用。

任何一项失败都停止应用层发布。

## 5. 回滚策略

Postgres 结构迁移优先采用“向前修复”，避免破坏性回滚造成数据丢失。M1 的回滚分级如下：

| 情况 | 操作 |
|---|---|
| migration 尚未执行完成 | 依赖事务自动回滚，检查 migration 状态后修复 SQL |
| 表已创建、尚无业务写入 | 停止发布，创建新的修复/撤销 migration，按依赖逆序删除新增对象 |
| 已有用户关注数据 | 禁止直接 drop；关闭新功能，备份相关表，发布兼容性 forward-fix |
| RLS/授权异常 | 立即撤销客户端 grant 或禁用受影响 API，保留数据，再发布策略修复 migration |
| 数据损坏 | 停止写入，根据恢复点/PITR 或已验证逻辑备份恢复到隔离环境，核对后再切换 |

逆序依赖为：认证 trigger/function → `user_team_follows` → `profiles` → `source_accounts` → `sources` → `team_aliases` → `teams` → `leagues`。任何实际撤销都必须生成新的 migration，不能编辑已经在生产执行过的旧 migration。

## 6. Day 10 演练记录

| 项目 | 2026-08-07 结果 |
|---|---|
| 迁移文件静态检查 | 通过：建表、外键索引、RLS、grant/revoke 与 seed 数量已复核 |
| 本地运行环境 | 通过：Docker Engine 29.6.2、Supabase CLI 2.112.0、Postgres 17.6 容器健康 |
| 空库 reset | 通过：连续 2 次完整执行 4 个 migration 与 `seed.sql` |
| seed 幂等 | 通过：额外直接重放 1 次；计数保持 5/14/62/19/19 |
| pgTAP | 通过：2 个文件、43 项测试全绿，包含双用户 RLS 行为测试 |
| 数据库 lint/advisors | 通过：`public` schema 无 error；security 与 performance advisors 均无问题 |
| 应用 lint/typecheck/build | 通过：ESLint、TypeScript `--noEmit`、Next.js 16.3.0 production build 全绿 |
| 生产备份 | 未执行：CLI 当前无管理 access token；不使用 publishable key 冒充管理权限 |
| 远程漂移/生产迁移 | 未执行：必须先登录、核对远程 migration 历史、确认平台备份/PITR 并完成逻辑备份恢复演练 |

本地 Day 10 验收已经完成；生产发布仍受备份、远程漂移和 dry-run 证据约束。仓库实现可进入代码审查，但不能据此标记为已上线。

