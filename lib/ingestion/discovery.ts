import { createHash } from "node:crypto";

import { matchTeamIds } from "./normalize";
import type { DiscoveryCandidate } from "./discovery-types";
import type { DiscoverySource } from "./source-catalog";
import type { FeedItem, IngestionAdapter } from "./types";

type Fetcher = typeof fetch;
type DiscoveredUrl = {
  url: string;
  title: string;
  description: string;
  publishedAt: string | null;
  origin: DiscoveryCandidate["evidenceOrigin"];
};

const USER_AGENT = "0126-football-source-discovery/1.0 (+metadata-only)";
const MAX_RESPONSE_BYTES = 2_000_000;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1")
    .replace(/&amp;/gu, "&")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, "\"")
    .replace(/&#39;|&apos;/gu, "'")
    .replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

function stripMarkup(value: string): string {
  return decodeXml(value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ")).slice(0, 600);
}

function firstTag(block: string, names: string[]): string {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "iu"));
    if (match) return decodeXml(match[1]);
  }
  return "";
}

function normalizeDate(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function safeUrl(value: string, baseUrl: string): URL | null {
  try {
    const parsed = new URL(value, baseUrl);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_.+|fbclid|gclid|ref)$/iu.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
  } catch {
    return null;
  }
}

function sameSourceHost(value: URL, source: DiscoverySource): boolean {
  const sourceHost = new URL(source.homepageUrl).hostname.toLocaleLowerCase();
  const valueHost = value.hostname.toLocaleLowerCase();
  return valueHost === sourceHost || valueHost.endsWith(`.${sourceHost.replace(/^www\./u, "")}`);
}

export function parseRobotsSitemaps(robots: string, source: DiscoverySource): string[] {
  return robots
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*sitemap\s*:\s*(\S+)/iu)?.[1] ?? "")
    .filter(Boolean)
    .map((value) => safeUrl(value, source.homepageUrl))
    .filter((value): value is URL => Boolean(value && sameSourceHost(value, source)))
    .map((value) => value.toString());
}

export function parseDiscoveryDocument(xml: string, documentUrl: string): {
  nested: string[];
  entries: DiscoveredUrl[];
} {
  const nested: string[] = [];
  const entries: DiscoveredUrl[] = [];
  if (/<sitemapindex\b/iu.test(xml)) {
    for (const match of xml.matchAll(/<sitemap(?:\s[^>]*)?>([\s\S]*?)<\/sitemap>/giu)) {
      const loc = safeUrl(firstTag(match[1], ["loc"]), documentUrl);
      if (loc) nested.push(loc.toString());
    }
    return { nested, entries };
  }

  if (/<urlset\b/iu.test(xml)) {
    for (const match of xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/giu)) {
      const block = match[1];
      const loc = safeUrl(firstTag(block, ["loc"]), documentUrl);
      if (!loc) continue;
      entries.push({
        url: loc.toString(),
        title: firstTag(block, ["news:title", "image:title"]),
        description: "",
        publishedAt: normalizeDate(firstTag(block, ["news:publication_date", "lastmod"])),
        origin: "sitemap",
      });
    }
    return { nested, entries };
  }

  for (const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/giu)) {
    const block = match[1];
    const loc = safeUrl(firstTag(block, ["link", "guid"]), documentUrl);
    if (!loc) continue;
    entries.push({
      url: loc.toString(),
      title: firstTag(block, ["title"]),
      description: stripMarkup(firstTag(block, ["description", "content:encoded"])),
      publishedAt: normalizeDate(firstTag(block, ["pubDate", "dc:date"])),
      origin: "rss",
    });
  }

  for (const match of xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/giu)) {
    const block = match[1];
    const href = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/iu)?.[1] ?? firstTag(block, ["link"]);
    const loc = safeUrl(href, documentUrl);
    if (!loc) continue;
    entries.push({
      url: loc.toString(),
      title: firstTag(block, ["title"]),
      description: stripMarkup(firstTag(block, ["summary", "content"])),
      publishedAt: normalizeDate(firstTag(block, ["published", "updated"])),
      origin: "atom",
    });
  }
  return { nested, entries };
}

function metaContent(html: string, keys: string[]): string {
  for (const tag of html.match(/<meta\b[^>]*>/giu) ?? []) {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/gu)) attributes.set(match[1].toLocaleLowerCase(), decodeXml(match[3]));
    const name = attributes.get("property") ?? attributes.get("name") ?? "";
    if (keys.includes(name.toLocaleLowerCase())) return attributes.get("content")?.trim() ?? "";
  }
  return "";
}

export function parseArticleMetadata(html: string): { title: string; description: string; publishedAt: string | null } {
  const title = metaContent(html, ["og:title", "twitter:title"])
    || stripMarkup(html.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/iu)?.[1] ?? "");
  const description = metaContent(html, ["og:description", "twitter:description", "description"]).slice(0, 600);
  const publishedAt = normalizeDate(metaContent(html, ["article:published_time", "date", "datepublished"]));
  return { title, description, publishedAt };
}

export function parseListingLinks(html: string, listingUrl: string): string[] {
  const links: string[] = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/giu)) {
    const parsed = safeUrl(decodeXml(match[1]), listingUrl);
    if (parsed) links.push(parsed.toString());
  }
  return Array.from(new Set(links));
}

async function fetchBoundedText(url: string, fetcher: Fetcher, signal?: AbortSignal): Promise<string> {
  const response = await fetcher(url, { signal, headers: { accept: "application/xml,text/xml,application/rss+xml,application/atom+xml,text/html;q=0.8,*/*;q=0.1", "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`discovery_http_${response.status}`);
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("discovery_response_too_large");
  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) throw new Error("discovery_response_too_large");
  return text;
}

function likelyArticle(url: URL, source: DiscoverySource): boolean {
  const path = url.pathname.toLocaleLowerCase();
  if (path === "/" || /\.(?:jpg|jpeg|png|gif|webp|svg|pdf|xml|gz)$/iu.test(path)) return false;
  if (/\/(?:tag|tags|category|categories|search|video|videos|photo|photos|settings|account|privacy|terms|tickets|shop)(?:\/|$)/iu.test(path)) return false;
  if (/\/news\/all(?:\/|$)/iu.test(path)) return false;
  if (source.articlePathPattern && !new RegExp(source.articlePathPattern, "iu").test(url.pathname)) return false;
  return path.split("/").filter(Boolean).length >= 2;
}

function chooseNestedSitemaps(urls: string[]): string[] {
  const news = urls.filter((url) => /news|article|story|post/iu.test(url));
  const pool = news.length ? news : urls;
  return pool.slice(-4);
}

export async function discoverSourceCandidates(input: {
  source: DiscoverySource;
  discoveryUrl?: string;
  fetcher?: Fetcher;
  limit?: number;
  signal?: AbortSignal;
}): Promise<DiscoveryCandidate[]> {
  const { source, signal } = input;
  const fetcher = input.fetcher ?? fetch;
  const limit = Math.min(Math.max(input.limit ?? 12, 1), 20);
  const rootUrl = input.discoveryUrl ?? new URL("/robots.txt", source.homepageUrl).toString();
  const root = safeUrl(rootUrl, source.homepageUrl);
  if (!root || !sameSourceHost(root, source)) throw new Error("discovery_url_not_allowlisted");

  const rootText = await fetchBoundedText(root.toString(), fetcher, signal);
  let documents = /^\s*user-agent\s*:/imu.test(rootText)
    ? parseRobotsSitemaps(rootText, source)
    : [root.toString()];
  if (!documents.length) documents = [new URL("/sitemap.xml", source.homepageUrl).toString()];

  const discovered: DiscoveredUrl[] = [];
  for (const documentUrl of documents.slice(0, 3)) {
    try {
      const parsed = parseDiscoveryDocument(await fetchBoundedText(documentUrl, fetcher, signal), documentUrl);
      discovered.push(...parsed.entries);
      for (const nestedUrl of chooseNestedSitemaps(parsed.nested)) {
        const nested = safeUrl(nestedUrl, documentUrl);
        if (!nested || !sameSourceHost(nested, source)) continue;
        try {
          const nestedParsed = parseDiscoveryDocument(await fetchBoundedText(nested.toString(), fetcher, signal), nested.toString());
          discovered.push(...nestedParsed.entries);
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  for (const listingUrl of source.listingUrls ?? []) {
    const parsedListing = safeUrl(listingUrl, source.homepageUrl);
    if (!parsedListing || !sameSourceHost(parsedListing, source)) continue;
    try {
      const html = await fetchBoundedText(parsedListing.toString(), fetcher, signal);
      discovered.push(...parseListingLinks(html, parsedListing.toString()).map((url) => ({
        url,
        title: "",
        description: "",
        publishedAt: null,
        origin: "sitemap" as const,
      })));
    } catch {
      continue;
    }
  }

  const unique = Array.from(new Map(discovered
    .map((entry) => ({ ...entry, parsed: safeUrl(entry.url, source.homepageUrl) }))
    .filter((entry): entry is DiscoveredUrl & { parsed: URL } => Boolean(entry.parsed && sameSourceHost(entry.parsed, source) && likelyArticle(entry.parsed, source)))
    .map((entry) => [entry.parsed.toString(), entry])).values())
    .sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""))
    .slice(0, limit * 2);

  const enriched = await Promise.all(unique.map(async (entry) => {
    try {
      const metadata = parseArticleMetadata(await fetchBoundedText(entry.parsed.toString(), fetcher, signal));
      return {
        ...entry,
        title: metadata.title || entry.title,
        description: metadata.description || entry.description,
        publishedAt: metadata.publishedAt ?? entry.publishedAt,
      };
    } catch {
      return entry;
    }
  }));

  return enriched
    .filter((entry) => entry.title.trim().length >= 3)
    .slice(0, limit)
    .map((entry) => {
      const publishedAt = entry.publishedAt ?? new Date(0).toISOString();
      const contentHash = createHash("sha256").update(`${entry.parsed.toString()}\n${entry.title}\n${entry.description}`).digest("hex");
      const predictedTeamIds = Array.from(new Set([
        ...matchTeamIds({ externalId: contentHash.slice(0, 24), url: entry.parsed.toString(), title: entry.title, summary: entry.description, publishedAt }),
        ...(source.defaultTeamId ? [source.defaultTeamId] : []),
      ]));
      return {
        id: contentHash.slice(0, 24),
        sourceId: source.id,
        sourceSlug: source.slug,
        sourceName: source.name,
        title: entry.title.trim(),
        url: entry.parsed.toString(),
        publishedAt,
        excerpt: entry.description.trim().slice(0, 600),
        contentHash,
        predictedTeamIds,
        evidenceOrigin: entry.origin,
      };
    });
}

export class ApprovedDiscoveryAdapter implements IngestionAdapter {
  readonly kind = "approved_feed" as const;
  readonly simulated = false;

  constructor(
    readonly source: DiscoverySource,
    readonly discoveryUrl: string,
    private readonly maxItems = 20,
    private readonly fetcher: Fetcher = fetch,
    private readonly translateCandidates: (candidates: DiscoveryCandidate[]) => Promise<DiscoveryCandidate[]> = async (candidates) => candidates,
  ) {}

  get key(): string { return this.source.slug; }
  get sourceId(): string { return this.source.id; }

  async fetchItems(signal?: AbortSignal): Promise<FeedItem[]> {
    const candidates = await discoverSourceCandidates({ source: this.source, discoveryUrl: this.discoveryUrl, fetcher: this.fetcher, limit: this.maxItems, signal });
    const translated = await this.translateCandidates(candidates);
    return translated.map((candidate) => ({
      externalId: candidate.id,
      url: candidate.url,
      title: candidate.translatedTitle ?? candidate.title,
      summary: (candidate.translatedExcerpt ?? candidate.excerpt) || null,
      publishedAt: candidate.publishedAt,
      teamHints: candidate.predictedTeamIds,
      raw: { discovery_origin: candidate.evidenceOrigin, content_hash: candidate.contentHash, source_title: candidate.title, source_excerpt: candidate.excerpt, translation_status: candidate.translationStatus },
    }));
  }
}
