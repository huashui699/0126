import { expect, test } from "@playwright/test";

test("Preview 使用真实 Supabase 数据并可打开新闻详情", async ({ page }) => {
  await page.goto("/?month=2026-08");

  await expect(page.getByRole("heading", { name: "足球情报日历" })).toBeVisible();
  await expect(page.getByText("当前展示验收样例数据，仅用于验证产品流程。")).toHaveCount(0);

  const firstNews = page.locator('a[href^="/news/"]').first();
  await expect(firstNews).toBeVisible();
  await firstNews.click();

  await expect(page.getByRole("heading", { name: "新闻内容" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "来源与可信度" })).toBeVisible();
  await expect(page.getByRole("link", { name: /查看原文/ })).toHaveAttribute("target", "_blank");
});

test("Preview 对不存在的真实新闻返回明确空状态", async ({ page }) => {
  await page.goto("/news/00000000-0000-4000-8000-000000000000");

  await expect(page.getByRole("heading", { name: "没有找到这条情报" })).toBeVisible();
  await expect(page.getByRole("link", { name: "返回日历" })).toBeVisible();
});
