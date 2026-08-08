import { expect, test } from "@playwright/test";

test("进入网站直接展示月历和三色信息数量", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08");

  await expect(page.getByRole("heading", { name: "足球情报日历" })).toBeVisible();
  await expect(page.getByRole("button", { name: /关注球队.*全部球队/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /8月8日周六.*官方确认 1.*待核实 1.*传闻 0/ })).toBeVisible();
  await expect(page.getByText("官方确认", { exact: true })).toBeVisible();
  await expect(page.getByText("待核实", { exact: true })).toBeVisible();
  await expect(page.getByText("传闻", { exact: true })).toBeVisible();
});

test("点击日期显示当天各条信息简述", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-07");
  await page.getByRole("button", { name: /8月8日周六.*官方确认 1.*待核实 1/ }).click();

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
