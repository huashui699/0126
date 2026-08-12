import type { FeedItem, IngestionAdapter } from "./types";

export const mockFeedItems: FeedItem[] = [
  {
    externalId: "mock-arsenal-001",
    url: "https://example.invalid/fixtures/arsenal-training?utm_source=acceptance",
    title: "阿森纳开放训练日（模拟采集样例）",
    summary: "用于验证采集、规范化和日历写入，不代表真实新闻。",
    content: "这是一条明确标记为模拟数据的 Day 25 验收记录。",
    publishedAt: "2026-08-08T08:00:00Z",
    teamHints: ["阿森纳", "Arsenal"],
    raw: { fixture: true, rights: "synthetic" },
  },
  {
    externalId: "mock-inter-001",
    url: "https://example.invalid/fixtures/inter-schedule#details",
    title: "国际米兰赛程提醒（模拟采集样例）",
    summary: "第二条模拟记录用于验证批处理与球队别名匹配。",
    publishedAt: "2026-08-09T02:30:00Z",
    teamHints: ["Inter Milan", "国际米兰"],
    raw: { fixture: true, rights: "synthetic" },
  },
];

export class MockFeedAdapter implements IngestionAdapter {
  readonly key = "0126-synthetic-feed";
  readonly kind = "mock" as const;
  readonly sourceId = null;
  readonly simulated = true;

  async fetchItems(): Promise<FeedItem[]> {
    return mockFeedItems.map((item) => ({ ...item, raw: { ...item.raw } }));
  }
}

type JsonFetcher = (url: string, init: RequestInit) => Promise<Response>;

export class ApprovedJsonFeedAdapter implements IngestionAdapter {
  readonly kind = "approved_feed" as const;
  readonly simulated = false;

  constructor(
    readonly key: string,
    readonly sourceId: string,
    private readonly feedUrl: string,
    private readonly fetcher: JsonFetcher = fetch,
  ) {}

  async fetchItems(signal?: AbortSignal): Promise<FeedItem[]> {
    const response = await this.fetcher(this.feedUrl, {
      signal,
      headers: { accept: "application/json", "user-agent": "0126-football-ingestion/1.0" },
    });
    if (!response.ok) throw new Error(`feed_http_${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("feed_contract_invalid");
    return payload.map((entry, index) => parseContractItem(entry, index));
  }
}

function parseContractItem(value: unknown, index: number): FeedItem {
  if (!value || typeof value !== "object") throw new Error(`feed_item_${index}_invalid`);
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.url !== "string" || typeof row.title !== "string" || typeof row.published_at !== "string") {
    throw new Error(`feed_item_${index}_invalid`);
  }
  return {
    externalId: row.id,
    url: row.url,
    title: row.title,
    summary: typeof row.summary === "string" ? row.summary : null,
    content: typeof row.content === "string" ? row.content : null,
    author: typeof row.author === "string" ? row.author : null,
    publishedAt: row.published_at,
    teamHints: Array.isArray(row.team_hints) ? row.team_hints.filter((hint): hint is string => typeof hint === "string") : [],
    raw: row,
  };
}
