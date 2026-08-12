import { expect, test } from "@playwright/test";

function buildWorkspaceSample(index: number) {
  const suffix = String(index + 1).padStart(4, "0");
  const emptyHuman = {
    annotatorId: "",
    trustStatus: "",
    teamIds: [],
    clusterId: "",
    summaryFidelity: "",
    reason: "",
    completed: false,
    completedAt: null,
  };

  return {
    sampleId: `day41-${suffix}`,
    title: `容量验证样本 ${suffix}`,
    sourceUrl: `https://example.com/day41/${suffix}`,
    sourceExcerpt: "仅用于本地容量与检索验证。",
    contentHash: suffix.padEnd(64, "0"),
    notes: "Day 43 自动化容量基线",
    annotationA: emptyHuman,
    adjudication: emptyHuman,
    prediction: {
      trustStatus: "",
      teamIds: [],
      clusterId: "",
      completed: false,
      completedAt: null,
    },
  };
}

test("Day 41 标注台完成 A、B、预测并在刷新后保留", async ({ page }) => {
  await page.goto("/admin/evaluation");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(page.getByRole("status").first()).toContainText("工作区为空");
  await expect(
    page.getByRole("heading", { name: "人工标注与发布门禁" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "新增第一条样本" }).click();
  await page.getByLabel("当前人员代号").fill("annotator-a");
  await page.getByLabel("标题").fill("曼城发布训练安排");
  await page.getByLabel("来源 URL").fill("https://www.mancity.com/example");
  await page.getByLabel("可信度标签").selectOption("unverified");
  await page.getByLabel("摘要忠实度").selectOption("pass");
  await page.getByLabel("曼城").check();
  await page
    .getByLabel("判断理由")
    .fill("来源可追溯，但当前样本尚未满足绿色硬门禁。");
  await page.getByRole("button", { name: "完成 A 标注" }).click();

  await page.getByRole("tab", { name: "2. B 复核裁决" }).click();
  await page.getByLabel("当前人员代号").fill("annotator-b");
  await page.getByLabel("可信度标签").selectOption("unverified");
  await page.getByLabel("摘要忠实度").selectOption("pass");
  await page.getByLabel("曼城").check();
  await page
    .getByLabel("判断理由")
    .fill("复核来源与声明主体后维持蓝色裁决。");
  await page.getByRole("button", { name: "冻结最终裁决" }).click();

  await page.getByRole("tab", { name: "3. 系统预测" }).click();
  await page.getByLabel("系统可信度标签").selectOption("unverified");
  await page.getByLabel("曼城").check();
  await page
    .getByRole("button", { name: "冻结系统预测并计分" })
    .click();

  await expect(page.getByText("1/300")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /day41-0001.*可计分/ }),
  ).toBeVisible();
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.getByText("曼城发布训练安排")).toBeVisible();
  await expect(page.getByText("已恢复 1 条本地样本。")).toBeVisible();
});

test("自动发现候选并一键加入本地标注工作区", async ({ page }) => {
  await page.route("**/api/evaluation/discovery**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has("source")) {
      await route.fulfill({
        json: { ok: true, sources: [{ slug: "premier-league-official", name: "Premier League Official", homepageUrl: "https://www.premierleague.com/" }] },
      });
      return;
    }
    await route.fulfill({
      json: {
        ok: true,
        candidates: [{
          id: "candidate-1",
          sourceId: "30000000-0000-4000-8000-000000000001",
          sourceSlug: "premier-league-official",
          sourceName: "Premier League Official",
          title: "Arsenal publish official squad update",
          translatedTitle: "阿森纳发布官方阵容更新",
          url: "https://www.premierleague.com/en/news/123/example",
          publishedAt: "2026-08-09T08:00:00.000Z",
          excerpt: "Official squad update from the Premier League website.",
          translatedExcerpt: "英超官网发布了官方阵容更新。",
          translationStatus: "translated",
          contentHash: "a".repeat(64),
          predictedTeamIds: ["20000000-0000-4000-8000-000000000006"],
          evidenceOrigin: "sitemap",
        }],
      },
    });
  });

  await page.goto("/admin/evaluation");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("status").first()).toContainText("工作区为空");
  await page.getByRole("button", { name: "自动发现最新候选" }).click();
  await expect(page.getByRole("heading", { name: "阿森纳发布官方阵容更新" })).toBeVisible();
  await expect(page.getByText("原文标题：Arsenal publish official squad update")).toBeVisible();
  await page.getByRole("button", { name: "领取并加入标注台" }).click();
  await expect(page.getByRole("textbox", { name: "标题", exact: true })).toHaveValue("阿森纳发布官方阵容更新");
  await expect(page.getByRole("textbox", { name: /必要短摘录/ })).toHaveValue("英超官网发布了官方阵容更新。");
  await expect(page.getByLabel("来源 URL")).toHaveValue("https://www.premierleague.com/en/news/123/example");
  await expect(page.getByText("已领取 day41-0001。", { exact: false })).toBeVisible();
});

test("300 条本地样本可恢复、检索并选择末条记录", async ({ page }) => {
  const samples = Array.from({ length: 300 }, (_, index) => buildWorkspaceSample(index));
  await page.addInitScript((workspace) => {
    window.localStorage.setItem("0126-football-day41-workspace-v1", JSON.stringify(workspace));
  }, {
    version: 1,
    actorId: "capacity-qa",
    samples,
    savedAt: "2026-08-09T00:00:00.000Z",
  });

  await page.goto("/admin/evaluation");

  await expect(page.getByText("已恢复 300 条本地样本。")).toBeVisible();
  await expect(page.getByText("300/300")).toBeVisible();
  await page.getByLabel("搜索样本").fill("day41-0300");
  const lastSample = page.getByRole("button", { name: /day41-0300.*容量验证样本 0300/ });
  await expect(lastSample).toBeVisible();
  await lastSample.click();
  await expect(page.getByLabel("标题")).toHaveValue("容量验证样本 0300");
});

test("自动发现 5xx 后可重试并恢复候选列表", async ({ page }) => {
  let discoveryAttempts = 0;
  await page.route("**/api/evaluation/discovery**", async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has("source")) {
      await route.fulfill({
        json: { ok: true, sources: [{ slug: "premier-league-official", name: "Premier League Official", homepageUrl: "https://www.premierleague.com/" }] },
      });
      return;
    }

    discoveryAttempts += 1;
    if (discoveryAttempts === 1) {
      await route.fulfill({ status: 503, json: { ok: false, detail: "upstream_temporarily_unavailable" } });
      return;
    }

    await route.fulfill({
      json: {
        ok: true,
        candidates: [{
          id: "candidate-recovered",
          sourceId: "30000000-0000-4000-8000-000000000001",
          sourceSlug: "premier-league-official",
          sourceName: "Premier League Official",
          title: "Recovered official update",
          url: "https://www.premierleague.com/en/news/recovered",
          publishedAt: "2026-08-09T09:00:00.000Z",
          excerpt: "The second request succeeds.",
          contentHash: "b".repeat(64),
          predictedTeamIds: [],
          evidenceOrigin: "sitemap",
        }],
      },
    });
  });

  await page.goto("/admin/evaluation");
  const discoverButton = page.getByRole("button", { name: "自动发现最新候选" });
  await discoverButton.click();
  await expect(page.getByRole("status").filter({ hasText: "发现失败" })).toContainText("upstream_temporarily_unavailable");
  await expect(discoverButton).toBeEnabled();

  await discoverButton.click();
  await expect(page.getByRole("heading", { name: "Recovered official update" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "已发现" })).toContainText("1 条候选");
});

test("标注台关键区域具备语义名称并可用键盘切换阶段", async ({ page }) => {
  await page.goto("/admin/evaluation");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "人工标注与发布门禁" })).toBeVisible();
  await expect(page.getByRole("region", { name: "自动获取候选新闻" })).toBeVisible();
  await page.getByRole("button", { name: "新增第一条样本" }).click();

  const adjudicationTab = page.getByRole("tab", { name: "2. B 复核裁决" });
  await adjudicationTab.focus();
  await page.keyboard.press("Enter");
  await expect(adjudicationTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { level: 2, name: "B 复核与最终裁决" })).toBeVisible();
  await expect(page.getByRole("button", { name: "删除样本" })).toBeVisible();
});
