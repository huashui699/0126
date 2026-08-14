import { createHash } from "node:crypto";

import { teams } from "../teams";
import type { FeedItem, NormalizedItem } from "./types";

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

function cleanText(value: string | null | undefined, limit: number): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, limit) : null;
}

export function normalizeUrl(input: string): string {
  const url = new URL(input);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("unsupported_url_protocol");
  }
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

function comparableText(value: string): string {
  return ` ${value.toLocaleLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

export function matchTeamIds(item: FeedItem): string[] {
  const explicitIds = new Set((item.teamHints ?? []).filter((hint) => teams.some((team) => team.id === hint)));
  const haystack = comparableText([item.title, item.summary, item.content, ...(item.teamHints ?? [])].filter(Boolean).join(" "));
  return teams.flatMap((team) => {
    const names = [team.nameZh, team.nameEn, team.shortNameZh, team.shortNameEn, ...team.aliases];
    const matched = names.some((name) => {
      const needle = comparableText(name).trim();
      return needle.length > 1 && haystack.includes(` ${needle} `);
    });
    return matched || explicitIds.has(team.id) ? [team.id] : [];
  });
}

export function normalizeFeedItem(
  sourceKey: string,
  sourceId: string | null,
  simulated: boolean,
  item: FeedItem,
): NormalizedItem {
  const externalId = item.externalId.trim().slice(0, 500);
  if (!externalId) throw new Error("missing_external_id");
  const title = cleanText(item.title, 500);
  if (!title) throw new Error("missing_title");
  const publishedAt = new Date(item.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) throw new Error("invalid_published_at");
  const normalizedUrl = normalizeUrl(item.url);
  const summary = cleanText(item.summary, 600);
  const bodyExcerpt = cleanText(item.content, 2_000);
  const contentHash = createHash("sha256")
    .update([normalizedUrl, title.toLocaleLowerCase(), publishedAt.toISOString()].join("\n"))
    .digest("hex");

  return {
    sourceKey,
    sourceId,
    externalId,
    originalUrl: item.url,
    normalizedUrl,
    title,
    summary,
    bodyExcerpt,
    author: cleanText(item.author, 240),
    publishedAt: publishedAt.toISOString(),
    contentHash,
    rawPayload: item.raw ?? {},
    isSimulated: simulated,
    teamIds: matchTeamIds(item),
  };
}
