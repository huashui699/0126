import { MockFeedAdapter } from "@/lib/ingestion/adapters";
import { ApprovedDiscoveryAdapter } from "@/lib/ingestion/discovery";
import { isAuthorizedIngestionRequest } from "@/lib/ingestion/request-auth";
import { runIngestion, runIsolatedBatch } from "@/lib/ingestion/runner";
import { getDiscoverySourceById } from "@/lib/ingestion/source-catalog";
import { SupabaseIngestionRepository } from "@/lib/ingestion/supabase-repository";
import { translateCandidatesToChinese } from "@/lib/intelligence/translate-candidates";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

type DiscoveryConfig = {
  id: string;
  source_id: string;
  discovery_url: string;
  max_items: number;
};

async function executeScheduledDiscovery() {
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const { data, error } = await client
    .from("source_discovery_configs")
    .select("id,source_id,discovery_url,max_items")
    .eq("enabled", true)
    .limit(20);
  if (error) return Response.json({ ok: false, error: "discovery_config_read_failed" }, { status: 500 });
  const configs = (data ?? []) as DiscoveryConfig[];
  if (!configs.length) return Response.json({ ok: true, status: "skipped", reason: "no_enabled_discovery_sources", results: [] });

  const repository = new SupabaseIngestionRepository(client);
  const bucket = new Date().toISOString().slice(0, 10);
  const runnable = configs.flatMap((config) => {
    const source = getDiscoverySourceById(config.source_id);
    return source ? [{ config, source }] : [];
  });
  const results = await runIsolatedBatch(runnable.map(({ config, source }) => ({
    adapter: new ApprovedDiscoveryAdapter(source, config.discovery_url, config.max_items, fetch, translateCandidatesToChinese),
    repository,
    idempotencyKey: `${source.slug}:schedule:v3:${bucket}`,
    triggerType: "schedule" as const,
  })));

  await Promise.all(runnable.map(({ config }, index) => {
    const result = results[index];
    return client.from("source_discovery_configs").update({
      last_attempted_at: new Date().toISOString(),
      last_succeeded_at: result.status === "succeeded" || result.status === "skipped" ? new Date().toISOString() : null,
      last_error: result.errors.length ? result.errors.join(" | ").slice(0, 2_000) : null,
    }).eq("id", config.id);
  }));
  return Response.json({ ok: results.every((result) => result.status !== "failed"), status: "completed", results }, {
    status: results.some((result) => result.status === "failed") ? 207 : 200,
  });
}

async function executeMockReplay(triggerType: "schedule" | "preview") {
  if (process.env.INGESTION_ENABLE_MOCK !== "true") {
    return Response.json({ ok: true, status: "skipped", reason: "mock_ingestion_disabled" });
  }
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const bucket = new Date().toISOString().slice(0, 10);
  const result = await runIngestion({
    adapter: new MockFeedAdapter(),
    repository: new SupabaseIngestionRepository(client),
    idempotencyKey: `mock:${triggerType}:${bucket}`,
    triggerType,
  });
  return Response.json({ ok: result.status !== "failed", explicitSimulation: true, result }, { status: result.status === "failed" ? 500 : 200 });
}

export async function GET(request: Request) {
  if (!isAuthorizedIngestionRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return executeScheduledDiscovery();
}

export async function POST(request: Request) {
  if (!isAuthorizedIngestionRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return executeMockReplay("preview");
}
