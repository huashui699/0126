export type DiscoveryCandidate = {
  id: string;
  sourceId: string;
  sourceSlug: string;
  sourceName: string;
  title: string;
  url: string;
  publishedAt: string;
  excerpt: string;
  contentHash: string;
  predictedTeamIds: string[];
  evidenceOrigin: "rss" | "atom" | "sitemap" | "official_api";
  translatedTitle?: string;
  translatedExcerpt?: string;
  translationStatus?: "translated" | "source_chinese" | "not_configured" | "failed" | "rejected";
};
