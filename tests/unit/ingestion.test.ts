import assert from "node:assert/strict";
import test from "node:test";

import { ApprovedJsonFeedAdapter, MockFeedAdapter } from "../../lib/ingestion/adapters";
import { discoverSourceCandidates, parseArticleMetadata, parseDiscoveryDocument, parseListingLinks, parseRobotsSitemaps } from "../../lib/ingestion/discovery";
import { MemoryIngestionRepository } from "../../lib/ingestion/memory-repository";
import { matchTeamIds, normalizeFeedItem, normalizeUrl } from "../../lib/ingestion/normalize";
import { runIngestion, runIsolatedBatch } from "../../lib/ingestion/runner";
import type { FeedItem, IngestionAdapter, SourcePermission } from "../../lib/ingestion/types";
import type { DiscoverySource } from "../../lib/ingestion/source-catalog";
import { teams } from "../../lib/teams";

const approvedSource: SourcePermission = {
  id: "30000000-0000-4000-8000-000000000099",
  slug: "approved-contract-source",
  name: "Approved Contract Source",
  accessStatus: "approved_feed",
  operationalClassification: "approved_adapter",
  collectionEnabled: true,
  active: true,
  identityVerified: true,
};

const discoverySource: DiscoverySource = {
  id: approvedSource.id,
  slug: approvedSource.slug,
  name: approvedSource.name,
  homepageUrl: "https://approved.example/",
};

test("robots、Sitemap 与文章元数据可以组成真实候选", async () => {
  assert.deepEqual(parseRobotsSitemaps(
    "User-agent: *\nSitemap: https://approved.example/sitemaps/index.xml\nSitemap: https://blocked.example/sitemap.xml",
    discoverySource,
  ), ["https://approved.example/sitemaps/index.xml"]);
  assert.deepEqual(
    parseDiscoveryDocument("<sitemapindex><sitemap><loc>https://approved.example/sitemaps/news.xml</loc></sitemap></sitemapindex>", "https://approved.example/sitemaps/index.xml").nested,
    ["https://approved.example/sitemaps/news.xml"],
  );
  assert.deepEqual(parseArticleMetadata('<meta property="og:title" content="Arsenal publish squad update"><meta name="description" content="Official squad announcement"><meta property="article:published_time" content="2026-08-09T08:00:00Z">'), {
    title: "Arsenal publish squad update",
    description: "Official squad announcement",
    publishedAt: "2026-08-09T08:00:00.000Z",
  });
  assert.equal(parseArticleMetadata('<meta property="og:title" content="Lewis: Now I\'m ready">').title, "Lewis: Now I'm ready");

  const documents = new Map([
    ["https://approved.example/robots.txt", "User-agent: *\nSitemap: https://approved.example/sitemaps/index.xml"],
    ["https://approved.example/sitemaps/index.xml", "<sitemapindex><sitemap><loc>https://approved.example/sitemaps/news.xml</loc></sitemap></sitemapindex>"],
    ["https://approved.example/sitemaps/news.xml", "<urlset><url><loc>https://approved.example/news/arsenal-squad</loc><lastmod>2026-08-09</lastmod></url></urlset>"],
    ["https://approved.example/news/arsenal-squad", '<html><head><meta property="og:title" content="Arsenal publish squad update"><meta name="description" content="Official squad announcement"><meta property="article:published_time" content="2026-08-09T08:00:00Z"></head></html>'],
  ]);
  const fetcher = async (input: string | URL | Request) => {
    const value = documents.get(String(input));
    return value === undefined ? new Response("missing", { status: 404 }) : new Response(value, { status: 200 });
  };
  const candidates = await discoverSourceCandidates({ source: discoverySource, fetcher: fetcher as typeof fetch });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "Arsenal publish squad update");
  assert.equal(candidates[0].excerpt, "Official squad announcement");
  assert.deepEqual(candidates[0].predictedTeamIds, ["20000000-0000-4000-8000-000000000006"]);
  assert.equal(candidates[0].contentHash.length, 64);
});

test("来源发现拒绝跨域 Sitemap，避免把接口变成任意 URL 代理", () => {
  assert.deepEqual(parseRobotsSitemaps(
    "Sitemap: https://evil.example/sitemap.xml",
    discoverySource,
  ), []);
});

test("白名单栏目页回退只提取链接并规范化相对 URL", () => {
  assert.deepEqual(parseListingLinks(
    '<a href="/news/123/story">Story</a><a href="https://approved.example/news/123/story">Duplicate</a>',
    "https://approved.example/news",
  ), ["https://approved.example/news/123/story"]);
});

test("URL 规范化移除追踪参数并产生稳定内容哈希", () => {
  assert.equal(
    normalizeUrl("https://example.com/news/item/?utm_source=x&b=2&a=1#top"),
    "https://example.com/news/item?a=1&b=2",
  );
  const item: FeedItem = {
    externalId: "1",
    url: "https://example.com/news/item?utm_medium=social",
    title: "  Arsenal   training update  ",
    publishedAt: "2026-08-08T00:00:00Z",
  };
  const first = normalizeFeedItem("source", null, true, item);
  const second = normalizeFeedItem("source", null, true, item);
  assert.equal(first.contentHash, second.contentHash);
  assert.equal(first.contentHash.length, 64);
});

test("球队别名匹配覆盖固定 14 队中的中英文提示", () => {
  const ids = matchTeamIds({
    externalId: "2",
    url: "https://example.com/2",
    title: "Inter Milan and Arsenal publish updates",
    publishedAt: "2026-08-08T00:00:00Z",
    teamHints: ["国际米兰", "阿森纳"],
  });
  assert.deepEqual(ids.sort(), [
    "20000000-0000-4000-8000-000000000006",
    "20000000-0000-4000-8000-000000000012",
  ]);
});

test("14 支球队逐队基准提示都能稳定映射且不越界", () => {
  assert.equal(teams.length, 14);
  for (const team of teams) {
    const ids = matchTeamIds({
      externalId: team.slug,
      url: `https://example.com/${team.slug}`,
      title: "球队更新",
      publishedAt: "2026-08-08T00:00:00Z",
      teamHints: [team.nameZh],
    });
    assert.deepEqual(ids, [team.id], `${team.nameZh} should map to its stable ID`);
  }
});

test("模拟 Feed 完成 raw 到 news 候选闭环并保持显式模拟标记", async () => {
  const repository = new MemoryIngestionRepository();
  const result = await runIngestion({
    adapter: new MockFeedAdapter(),
    repository,
    idempotencyKey: "mock:preview:2026-08-08",
    triggerType: "preview",
  });
  assert.equal(result.status, "succeeded");
  assert.equal(result.inserted, 2);
  assert.equal(repository.candidates.size, 2);
  assert.ok([...repository.candidates.values()].every(({ item }) => item.isSimulated && item.sourceId === null));
});

test("相同批次和相同条目均保持幂等", async () => {
  const repository = new MemoryIngestionRepository();
  const adapter = new MockFeedAdapter();
  const first = await runIngestion({ adapter, repository, idempotencyKey: "batch-1" });
  const sameBatch = await runIngestion({ adapter, repository, idempotencyKey: "batch-1" });
  const nextBatch = await runIngestion({ adapter, repository, idempotencyKey: "batch-2" });
  assert.equal(first.inserted, 2);
  assert.equal(sameBatch.status, "skipped");
  assert.equal(nextBatch.duplicates, 2);
  assert.equal(repository.candidates.size, 2);
});

test("未经批准来源在抓取前被拒绝", async () => {
  const repository = new MemoryIngestionRepository([{ ...approvedSource, collectionEnabled: false }]);
  const adapter: IngestionAdapter = {
    key: approvedSource.slug,
    kind: "approved_feed",
    sourceId: approvedSource.id,
    simulated: false,
    async fetchItems() { throw new Error("must_not_fetch"); },
  };
  await assert.rejects(
    runIngestion({ adapter, repository, idempotencyKey: "blocked-1" }),
    /source_not_approved/,
  );
  assert.equal(repository.runs.size, 0);
});

test("已批准 JSON Adapter 契约映射来源字段、时间和链接", async () => {
  const repository = new MemoryIngestionRepository([approvedSource]);
  const adapter = new ApprovedJsonFeedAdapter(
    approvedSource.slug,
    approvedSource.id,
    "https://approved.example/feed.json",
    async () => Response.json([{
      id: "contract-1",
      url: "https://approved.example/news/1?utm_source=feed",
      title: "Real Madrid contract fixture",
      summary: "Contract-only payload",
      published_at: "2026-08-08T12:00:00Z",
      team_hints: ["皇马"],
    }]),
  );
  const result = await runIngestion({ adapter, repository, idempotencyKey: "approved-contract-1" });
  assert.equal(result.status, "succeeded");
  assert.equal(result.inserted, 1);
  const saved = [...repository.candidates.values()][0].item;
  assert.equal(saved.normalizedUrl, "https://approved.example/news/1");
  assert.equal(saved.publishedAt, "2026-08-08T12:00:00.000Z");
  assert.equal(saved.isSimulated, false);
});

test("Adapter 重试与失败隔离不会阻塞其他来源", async () => {
  let attempts = 0;
  const flaky: IngestionAdapter = {
    key: "flaky-mock",
    kind: "mock",
    sourceId: null,
    simulated: true,
    async fetchItems() {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary_failure");
      return [];
    },
  };
  const invalid: IngestionAdapter = { ...flaky, key: "invalid-real", kind: "approved_feed", simulated: false };
  const results = await runIsolatedBatch([
    { adapter: flaky, repository: new MemoryIngestionRepository(), idempotencyKey: "flaky" },
    { adapter: invalid, repository: new MemoryIngestionRepository(), idempotencyKey: "invalid" },
  ]);
  assert.equal(attempts, 3);
  assert.equal(results[0].status, "succeeded");
  assert.equal(results[1].status, "failed");
});
