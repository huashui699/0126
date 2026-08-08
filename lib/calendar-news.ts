import { createPublicClient } from "@/lib/supabase";
import { monthRangeUtc, toShanghaiDateKey } from "@/lib/calendar-date";
import type { CalendarNews, InformationType, TrustStatus } from "@/types/news";

type CalendarResult = {
  items: CalendarNews[];
  mode: "live" | "preview" | "fallback";
};

const fixtureBase = {
  content: "这是用于验证日历、筛选与详情追溯的合成数据，不代表真实新闻。",
  image: null,
  created_at: "2026-08-08T00:00:00Z",
  trust_updated_at: "2026-08-08T00:05:00Z",
};

export const calendarFixtures: CalendarNews[] = [
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000001", title: "曼城公布公开训练安排（M3 验收样例）", summary: "球队公布本周公开训练和媒体开放时间，日历按原始发布时间展示。", source: "Manchester City Official · Fixture", url: "https://www.mancity.com/", league: "英超", team: "曼城", published_at: "2026-08-08T01:30:00Z", event_at: null, info_type: "club_announcement", trust_status: "confirmed", trust_reason: "验收数据标记为官方渠道样例；仅验证展示规则，不用于事实判断。", team_ids: ["20000000-0000-4000-8000-000000000004"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000002", title: "皇马新援参加合练（M3 验收样例）", summary: "多家媒体观察到新援参与合练，但俱乐部尚未发布完整名单。", source: "0126 Fixture Desk", url: "https://www.realmadrid.com/", league: "西甲", team: "皇家马德里", published_at: "2026-08-08T03:00:00Z", event_at: null, info_type: "media", trust_status: "unverified", trust_reason: "存在明确来源，但尚无针对该细节的直接官方确认。", team_ids: ["20000000-0000-4000-8000-000000000007"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000003", title: "利物浦确认青年队晋升名单（M3 验收样例）", summary: "俱乐部公布进入一线队训练名单的青年球员。", source: "Liverpool FC Official · Fixture", url: "https://www.liverpoolfc.com/", league: "英超", team: "利物浦", published_at: "2026-08-07T08:00:00Z", event_at: null, info_type: "player", trust_status: "confirmed", trust_reason: "验收数据模拟俱乐部官网直接发布。", team_ids: ["20000000-0000-4000-8000-000000000002"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000004", title: "巴萨训练赛阵容观察（M3 验收样例）", summary: "训练赛阵容来自媒体现场观察，正式比赛安排仍待官方发布。", source: "0126 Fixture Desk", url: "https://www.fcbarcelona.com/", league: "西甲", team: "巴塞罗那", published_at: "2026-08-06T12:20:00Z", event_at: null, info_type: "coaching", trust_status: "unverified", trust_reason: "单一媒体观察可追溯，但缺少第二个独立来源。", team_ids: ["20000000-0000-4000-8000-000000000008"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000005", title: "拜仁球迷开放日（M3 验收样例）", summary: "活动将在上海时间 8 月 10 日晚举行，日历按事件时间展示。", source: "FC Bayern Official · Fixture", url: "https://fcbayern.com/", league: "德甲", team: "拜仁慕尼黑", published_at: "2026-08-08T04:00:00Z", event_at: "2026-08-10T11:00:00Z", info_type: "social", trust_status: "confirmed", trust_reason: "验收数据模拟俱乐部官方活动公告，并保留独立事件时间。", team_ids: ["20000000-0000-4000-8000-000000000009"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000006", title: "国际米兰季前赛安排更新（M3 验收样例）", summary: "开球时间调整为上海时间 8 月 12 日凌晨。", source: "Inter Official · Fixture", url: "https://www.inter.it/", league: "意甲", team: "国际米兰", published_at: "2026-08-08T05:00:00Z", event_at: "2026-08-11T18:30:00Z", info_type: "match", trust_status: "confirmed", trust_reason: "验收数据模拟俱乐部官方赛程更新。", team_ids: ["20000000-0000-4000-8000-000000000012"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000007", title: "阿森纳续约谈判进展（M3 验收样例）", summary: "报道表示双方继续沟通，尚无正式公告。", source: "0126 Fixture Desk", url: "https://www.arsenal.com/", league: "英超", team: "阿森纳", published_at: "2026-08-09T02:00:00Z", event_at: null, info_type: "transfer", trust_status: "unverified", trust_reason: "报道可追溯，但俱乐部尚未确认谈判结论。", team_ids: ["20000000-0000-4000-8000-000000000006"] },
  { ...fixtureBase, id: "50000000-0000-4000-8000-000000000008", title: "巴黎公布社区活动（M3 验收样例）", summary: "俱乐部球员将参加本地青训社区活动。", source: "Paris Saint-Germain Official · Fixture", url: "https://www.psg.fr/", league: "法甲", team: "巴黎圣日耳曼", published_at: "2026-08-09T04:00:00Z", event_at: "2026-08-13T09:00:00Z", info_type: "club_announcement", trust_status: "confirmed", trust_reason: "验收数据模拟俱乐部官网直接发布的活动公告。", team_ids: ["20000000-0000-4000-8000-000000000013"] },
];

const selectFields = "id,title,summary,content,source,url,image,league,team,created_at,published_at,event_at,info_type,trust_status,trust_reason,trust_updated_at,news_teams(team_id)";

function normalizeRow(row: Record<string, unknown>): CalendarNews {
  const relations = Array.isArray(row.news_teams) ? row.news_teams : [];
  return {
    id: String(row.id),
    title: String(row.title),
    summary: typeof row.summary === "string" ? row.summary : null,
    content: typeof row.content === "string" ? row.content : null,
    source: typeof row.source === "string" ? row.source : null,
    url: typeof row.url === "string" ? row.url : null,
    image: typeof row.image === "string" ? row.image : null,
    league: typeof row.league === "string" ? row.league : null,
    team: typeof row.team === "string" ? row.team : null,
    created_at: String(row.created_at),
    published_at: String(row.published_at),
    event_at: typeof row.event_at === "string" ? row.event_at : null,
    info_type: row.info_type as InformationType,
    trust_status: row.trust_status as TrustStatus,
    trust_reason: String(row.trust_reason),
    trust_updated_at: String(row.trust_updated_at),
    team_ids: relations.flatMap((relation) => {
      if (relation && typeof relation === "object" && "team_id" in relation) return [String(relation.team_id)];
      return [];
    }),
  };
}

function fixturesForMonth(month: string): CalendarNews[] {
  return calendarFixtures.filter((item) => toShanghaiDateKey(item.event_at ?? item.published_at).startsWith(`${month}-`));
}

export async function getCalendarNews(month: string): Promise<CalendarResult> {
  const client = createPublicClient();
  if (!client) return { items: fixturesForMonth(month), mode: "preview" };

  const { start, end } = monthRangeUtc(month);
  const [published, events] = await Promise.all([
    client.from("news").select(selectFields).gte("published_at", start).lt("published_at", end).order("published_at", { ascending: true }),
    client.from("news").select(selectFields).gte("event_at", start).lt("event_at", end).order("event_at", { ascending: true }),
  ]);

  if (published.error || events.error) {
    console.error("Unable to load calendar news:", published.error?.message ?? events.error?.message);
    return { items: fixturesForMonth(month), mode: "fallback" };
  }

  const rows = [...(published.data ?? []), ...(events.data ?? [])] as unknown as Record<string, unknown>[];
  const items = Array.from(new Map(rows.map((row) => [String(row.id), normalizeRow(row)])).values());
  return { items: items.length ? items : fixturesForMonth(month), mode: items.length ? "live" : "fallback" };
}

export async function getCalendarNewsById(id: string): Promise<CalendarNews | null> {
  const fixture = calendarFixtures.find((item) => item.id === id) ?? null;
  const client = createPublicClient();
  if (!client) return fixture;

  const { data, error } = await client.from("news").select(selectFields).eq("id", id).maybeSingle();
  if (error) {
    console.error("Unable to load calendar detail:", error.message);
    return fixture;
  }
  return data ? normalizeRow(data as unknown as Record<string, unknown>) : fixture;
}

export function safeExternalUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
  } catch {
    return null;
  }
}

