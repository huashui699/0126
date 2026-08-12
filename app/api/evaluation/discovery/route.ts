import { discoverSourceCandidates } from "@/lib/ingestion/discovery";
import type { DiscoveryCandidate } from "@/lib/ingestion/discovery-types";
import { discoverySources, getDiscoverySource } from "@/lib/ingestion/source-catalog";
import { translateCandidatesToChinese } from "@/lib/intelligence/translate-candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; candidates: DiscoveryCandidate[] }>();
const pending = new Map<string, Promise<DiscoveryCandidate[]>>();

async function loadCandidates(sourceSlug: string): Promise<DiscoveryCandidate[]> {
  const cached = cache.get(sourceSlug);
  if (cached && cached.expiresAt > Date.now()) return cached.candidates;
  const existing = pending.get(sourceSlug);
  if (existing) return existing;
  const source = getDiscoverySource(sourceSlug);
  if (!source) throw new Error("source_not_allowlisted");

  const task = discoverSourceCandidates({ source, limit: 12 })
    .then(async (candidates) => {
      const translatedCandidates = await translateCandidatesToChinese(candidates);
      cache.set(sourceSlug, { expiresAt: Date.now() + CACHE_TTL_MS, candidates: translatedCandidates });
      return translatedCandidates;
    })
    .finally(() => pending.delete(sourceSlug));
  pending.set(sourceSlug, task);
  return task;
}

export async function GET(request: Request) {
  const sourceSlug = new URL(request.url).searchParams.get("source")?.trim();
  if (!sourceSlug) {
    return Response.json({
      ok: true,
      sources: discoverySources.map(({ slug, name, homepageUrl }) => ({ slug, name, homepageUrl })),
    }, { headers: { "cache-control": "public, max-age=300" } });
  }
  if (!getDiscoverySource(sourceSlug)) {
    return Response.json({ ok: false, error: "source_not_allowlisted" }, { status: 404 });
  }
  try {
    const candidates = await loadCandidates(sourceSlug);
    return Response.json({ ok: true, source: sourceSlug, candidates, fetchedAt: new Date().toISOString() }, {
      headers: { "cache-control": "private, max-age=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "discovery_failed";
    return Response.json({ ok: false, error: "discovery_failed", detail: message }, { status: 502 });
  }
}
