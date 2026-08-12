import { expect, test } from "@playwright/test";

test("球队选择弹窗支持最多五支、清空和取消", async ({ page }) => {
  await page.goto("/?month=2026-08&date=2026-08-08");
  await page.evaluate(() => localStorage.removeItem("0126football:guest-follows"));
  await page.reload();
  await page.getByRole("button", { name: /关注球队.*全部球队/ }).click();

  const dialog = page.getByRole("dialog", { name: "选择关注球队" });
  const teamButtons = dialog.locator(".dialog-team-grid button");
  for (let index = 0; index < 5; index += 1) await teamButtons.nth(index).click();
  await expect(dialog.getByText("5 / 5")).toBeVisible();
  await expect(teamButtons.nth(5)).toBeDisabled();

  await dialog.getByRole("button", { name: "查看全部球队" }).click();
  await expect(dialog.getByText("0 / 5")).toBeVisible();
  await dialog.getByRole("button", { name: "关闭球队选择" }).click();
  await expect(dialog).toBeHidden();
});
