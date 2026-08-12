import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { assessReliability, RELIABILITY_ENGINE_VERSION } from "@/lib/intelligence/reliability";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { newsIds?: string[] };
  let query = client.from("news").select("id,source_id,is_simulated,direct_official_assertion,sources(is_official,identity_verified,collection_enabled,access_status)").is("hidden_at", null).limit(50);
  if (body.newsIds?.length) query = query.in("id", body.newsIds.slice(0, 50));
  const { data: rows, error } = await query;
  if (error) return Response.json({ ok: false, error: "candidate_read_failed" }, { status: 500 });

  const results = [];
  for (const row of rows ?? []) {
    const sourceValue = Array.isArray(row.sources) ? row.sources[0] : row.sources;
    const source = sourceValue as { is_official?: boolean; identity_verified?: boolean; collection_enabled?: boolean; access_status?: string } | null;
    const { count } = await client.from("source_citations").select("id", { count: "exact", head: true }).eq("child_news_id", row.id).eq("is_independent", true);
    const assessment = assessReliability({
      sourceIsOfficial: Boolean(source?.is_official),
      sourceIdentityVerified: Boolean(source?.identity_verified),
      sourceCollectionApproved: Boolean(source?.collection_enabled && ["approved_feed", "approved_api"].includes(source.access_status ?? "")),
      directOfficialAssertion: Boolean(row.direct_official_assertion),
      isSimulated: Boolean(row.is_simulated),
      hasIdentifiableSource: Boolean(row.source_id),
      anonymousClaim: !row.source_id,
      citationDepth: 0,
      independentSourceCount: count ?? 0,
      conflictingEvidence: false,
    });
    const recorded = await client.rpc("record_reliability_assessment", {
      p_news_id: row.id,
      p_status: assessment.status,
      p_reason_codes: assessment.reasonCodes,
      p_explanation: assessment.explanation,
      p_evidence: { independentSourceCount: count ?? 0 },
      p_engine_version: RELIABILITY_ENGINE_VERSION,
      p_independent_source_count: count ?? 0,
      p_requires_review: assessment.requiresReview,
    });
    results.push({ newsId: row.id, status: recorded.error ? "failed" : assessment.status, error: recorded.error?.message ?? null });
  }
  return Response.json({ ok: results.every((item) => !item.error), engineVersion: RELIABILITY_ENGINE_VERSION, results });
}
