import { expect, test } from "@playwright/test";

const storageKey = "0126football:guest-follows";

test.beforeEach(async ({ page }) => {
  await page.goto("/onboarding/teams");
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload();
});

test("中英文和别名搜索均能定位球队", async ({ page }) => {
  const search = page.getByLabel("搜索球队");

  await search.fill("曼联");
  await expect(page.getByRole("button", { name: /曼彻斯特联/ })).toBeVisible();

  await search.fill("Manchester City");
  await expect(page.getByRole("button", { name: /曼彻斯特城/ })).toBeVisible();

  await search.fill("BVB");
  await expect(page.getByRole("button", { name: /多特蒙德/ })).toBeVisible();
});

test("游客可选择、排序、保存并在刷新后恢复", async ({ page }) => {
  await page.getByRole("button", { name: /曼彻斯特联/ }).click();
  await page.getByRole("button", { name: /利物浦/ }).click();
  await expect(page.getByText("2 / 5")).toBeVisible();

  await page.getByRole("button", { name: "上移利物浦" }).click();
  const selected = page.locator(".selection-panel li");
  await expect(selected.first()).toContainText("利物浦");

  await page.getByRole("button", { name: "保存我的球队" }).click();
  await expect(page.getByText(/已保存在此浏览器/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("2 / 5")).toBeVisible();
  await expect(page.locator(".selection-panel li").first()).toContainText("利物浦");

  await page.getByRole("button", { name: "取消关注利物浦" }).click();
  await expect(page.getByText("1 / 5")).toBeVisible();
});

test("达到五支上限后阻止继续选择", async ({ page }) => {
  const teamButtons = page.locator(".team-option");
  for (let index = 0; index < 5; index += 1) await teamButtons.nth(index).click();

  await expect(page.getByText("5 / 5")).toBeVisible();
  await expect(teamButtons.nth(5)).toBeDisabled();
});

test("损坏的游客数据会自动恢复", async ({ page }) => {
  await page.evaluate(({ key }) => localStorage.setItem(key, "not-json"), { key: storageKey });
  await page.reload();
  await expect(page.getByText(/异常的本地数据/)).toBeVisible();
  await expect(page.getByText("0 / 5")).toBeVisible();
});

test("无搜索结果提供清空入口且支持键盘选择", async ({ page }) => {
  const search = page.getByLabel("搜索球队");
  await search.fill("不存在的球队");
  await expect(page.getByText("没有找到匹配的球队")).toBeVisible();
  await page.getByRole("button", { name: "清空搜索" }).click();

  const firstTeam = page.locator(".team-option").first();
  await firstTeam.focus();
  await page.keyboard.press("Enter");
  await expect(firstTeam).toHaveAttribute("aria-pressed", "true");
});

