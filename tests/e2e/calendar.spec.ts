import { expect, test } from "@playwright/test";

const storageKey = "0126football:guest-follows";
const follows = {
  version: 1,
  teamIds: [
    "20000000-0000-4000-8000-000000000004",
    "20000000-0000-4000-8000-000000000007",
    "20000000-0000-4000-8000-000000000009",
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value);
  }, { key: storageKey, value: JSON.stringify(follows) });
});

test("日程按上海日期显示关注球队情报并支持前后日导航", async ({ page }) => {
  await page.goto("/calendar?month=2026-08&date=2026-08-08");

  await expect(page.getByRole("heading", { name: "我的球队情报日历" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "8月8日周六" })).toBeVisible();
  await expect(page.getByRole("link", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /皇马新援参加合练/ })).toBeVisible();

  await page.getByRole("button", { name: "后一天 →" }).click();
  await expect(page).toHaveURL(/date=2026-08-09/);
  await expect(page.getByText("这一天暂无情报")).toBeVisible();
});

test("月历显示三色计数并可进入选中日期", async ({ page }) => {
  await page.goto("/calendar?month=2026-08&date=2026-08-08&view=month");

  const day = page.getByRole("button", { name: /8月8日周六.*官方确认 1.*待核实 1.*传闻 0/ });
  await expect(day).toBeVisible();
  await day.click();

  await expect(page).toHaveURL(/view=agenda/);
  await expect(page.getByRole("heading", { name: "8月8日周六" })).toBeVisible();
});

test("球队、类型和可信度组合筛选写入 URL 并可刷新恢复", async ({ page }) => {
  await page.goto("/calendar?month=2026-08&date=2026-08-08");
  await page.locator("summary").click();
  await page.getByLabel("皇马").uncheck();
  await page.getByLabel("俱乐部公告").check();
  await page.getByLabel("官方确认").check();

  await expect(page).toHaveURL(/teams=manchester-city%2Cbayern-munich/);
  await expect(page).toHaveURL(/type=club_announcement/);
  await expect(page).toHaveURL(/trust=confirmed/);
  await expect(page.getByRole("link", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /皇马新援参加合练/ })).toHaveCount(0);

  await page.reload();
  await page.locator("summary").click();
  await expect(page.getByLabel("皇马")).not.toBeChecked();
  await expect(page.getByLabel("俱乐部公告")).toBeChecked();
  await expect(page.getByLabel("官方确认")).toBeChecked();
});

test("详情展示来源与标记原因，返回时保留日期和筛选", async ({ page }) => {
  await page.goto("/calendar?month=2026-08&date=2026-08-08&trust=confirmed");
  await page.getByRole("link", { name: /曼城公布公开训练安排/ }).click();

  await expect(page.getByRole("heading", { name: /曼城公布公开训练安排/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "为什么这样标记" })).toBeVisible();
  await expect(page.getByRole("link", { name: /mancity.com/ })).toHaveAttribute("target", "_blank");
  await expect(page.getByText(/完整审计历史将在 Day 37 实现/)).toBeVisible();

  await page.getByRole("link", { name: "← 返回原日期和筛选" }).click();
  await expect(page).toHaveURL(/date=2026-08-08/);
  await expect(page).toHaveURL(/trust=confirmed/);
});

