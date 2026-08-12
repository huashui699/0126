export type ClusterCandidate = {
  id: string;
  normalizedUrl: string;
  title: string;
  sourceId: string | null;
  sourceDomain: string;
  citesNewsId?: string | null;
};

export type ClusterDecision = {
  duplicate: boolean;
  method: "canonical_url" | "title_similarity" | "none";
  score: number;
  explanation: string;
};

const TRACKING_PARAMS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"]);

export function canonicalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (TRACKING_PARAMS.has(key.toLocaleLowerCase())) url.searchParams.delete(key);
    url.hostname = url.hostname.toLocaleLowerCase().replace(/^www\./u, "");
    url.pathname = url.pathname.replace(/\/+$/u, "") || "/";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function tokens(value: string): Set<string> {
  return new Set(value.normalize("NFKC").toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1));
}

export function titleSimilarity(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}

export function compareForClustering(left: ClusterCandidate, right: ClusterCandidate): ClusterDecision {
  if (canonicalizeUrl(left.normalizedUrl) === canonicalizeUrl(right.normalizedUrl)) {
    return { duplicate: true, method: "canonical_url", score: 1, explanation: "规范化 URL 完全一致。" };
  }
  const score = titleSimilarity(left.title, right.title);
  return score >= 0.72
    ? { duplicate: true, method: "title_similarity", score, explanation: `标题词项相似度 ${score.toFixed(2)} 达到 0.72 门槛。` }
    : { duplicate: false, method: "none", score, explanation: `标题词项相似度 ${score.toFixed(2)} 未达到门槛。` };
}

export function assessSourceIndependence(left: ClusterCandidate, right: ClusterCandidate): { independent: boolean; reason: string } {
  if (left.sourceId && left.sourceId === right.sourceId) return { independent: false, reason: "same_registered_source" };
  if (left.sourceDomain.toLocaleLowerCase() === right.sourceDomain.toLocaleLowerCase()) return { independent: false, reason: "same_canonical_domain" };
  if (left.citesNewsId === right.id || right.citesNewsId === left.id) return { independent: false, reason: "direct_citation_chain" };
  return { independent: true, reason: "distinct_source_without_known_citation" };
}
