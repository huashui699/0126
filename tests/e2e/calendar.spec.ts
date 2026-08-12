import { expect, test } from "@playwright/test";

test("进入网站直接展示一周、颜色数量和当天新闻", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08");

  await expect(page.getByRole("heading", { name: "足球情报日历" })).toBeVisible();
  await expect(page.getByRole("button", { name: /关注球队.*全部球队/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /8月8日周六.*官方确认 \d+.*待核实 \d+.*传闻 \d+/ })).toBeVisible();
  await expect(page.locator(".week-view .month-day")).toHaveCount(7);
  await expect(page.getByRole("link", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "展开整月" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("绿", { exact: true })).toHaveCount(0);
  await expect(page.getByText("蓝", { exact: true })).toHaveCount(0);
  await expect(page.getByText("红", { exact: true })).toHaveCount(0);
});

test("可展开完整月份并再次收起", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08");

  await page.getByRole("button", { name: "展开整月" }).click();
  await expect(page.getByRole("region", { name: "2026-08 完整月历" })).toBeVisible();
  await expect(page.locator(".full-month-view .month-day")).toHaveCount(42);
  await page.getByRole("button", { name: "收起整月" }).click();
  await expect(page.getByRole("region", { name: "2026-08 完整月历" })).toHaveCount(0);
});

test("未指定日期时自动显示当月有内容的新闻", async ({ page }) => {
  await page.goto("/?month=2026-08");

  await expect(page.getByRole("heading", { name: "8月6日周四" })).toBeVisible();
  await expect(page.getByRole("link", { name: /巴萨训练赛阵容观察/ })).toBeVisible();
});

test("点击日期显示当天各条信息简述", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-07");
  await page.getByRole("button", { name: /8月8日周六.*官方确认 \d+.*待核实 \d+/ }).click();

  await expect(page).toHaveURL(/date=2026-08-08/);
  await expect(page.getByRole("heading", { name: "8月8日周六" })).toBeVisible();
  await expect(page.getByRole("link", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByText(/球队公布本周公开训练和媒体开放时间/)).toBeVisible();
  await expect(page.getByRole("link", { name: /皇马新援参加合练/ })).toBeVisible();
});

test("球队弹窗选择会筛选日历并在刷新后保留", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08");
  await page.getByRole("button", { name: /关注球队.*全部球队/ }).click();

  const dialog = page.getByRole("dialog", { name: "选择关注球队" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /曼城/ }).click();
  await dialog.getByRole("button", { name: "应用到日历" }).click();

  await expect(page.getByRole("button", { name: /关注球队.*曼城/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /皇马新援参加合练/ })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: /关注球队.*曼城/ })).toBeVisible();
});

test("新闻详情展示内容和来源，并可返回原日期", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08");
  await page.getByRole("link", { name: /曼城公布公开训练安排/ }).click();

  await expect(page.getByRole("heading", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "新闻内容" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "来源与可信度" })).toBeVisible();
  await expect(page.getByText("Manchester City Official · Fixture")).toBeVisible();
  await expect(page.getByRole("link", { name: /mancity.com/ })).toHaveAttribute("target", "_blank");

  await page.getByRole("link", { name: "← 返回当天情报" }).click();
  await expect(page).toHaveURL(/date=2026-08-08/, { timeout: 15_000 });
});

test("登录与旧选队路径在首版中不再展示", async ({ page }) => {
  await page.goto("/auth");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "足球情报日历" })).toBeVisible();

  await page.goto("/onboarding/teams");
  await expect(page).toHaveURL(/\/$/);
});

test("高级类型筛选可由 URL 恢复且仍展示匹配新闻", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08&type=club_announcement");
  await page.locator("summary").filter({ hasText: "高级筛选" }).click();

  await expect(page.getByLabel("俱乐部公告")).toBeChecked();
  await expect(page.getByRole("link", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /皇马新援参加合练/ })).toHaveCount(0);

  await page.getByLabel("俱乐部公告").uncheck();
  await expect(page).not.toHaveURL(/type=/);
  await page.reload();
  await page.locator("summary").filter({ hasText: "高级筛选" }).click();
  await expect(page.getByLabel("俱乐部公告")).not.toBeChecked();
});
