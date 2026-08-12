import { normalizeFeedItem } from "./normalize";
import type { IngestionAdapter, IngestionRepository, RunCounts, RunResult, TriggerType } from "./types";

const APPROVED_STATUSES = new Set(["approved_feed", "approved_api"]);

function sourceIsAllowed(source: Awaited<ReturnType<IngestionRepository["getSourcePermission"]>>): boolean {
  return Boolean(
    source
    && APPROVED_STATUSES.has(source.accessStatus)
    && source.operationalClassification === "approved_adapter"
    && source.collectionEnabled
    && source.active
    && source.identityVerified,
  );
}

async function fetchWithRetry(adapter: IngestionAdapter, maxAttempts: number): Promise<Awaited<ReturnType<IngestionAdapter["fetchItems"]>>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      return await adapter.fetchItems(controller.signal);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("adapter_fetch_failed");
}

export async function runIngestion(input: {
  adapter: IngestionAdapter;
  repository: IngestionRepository;
  idempotencyKey: string;
  triggerType?: TriggerType;
  maxAttempts?: number;
}): Promise<RunResult> {
  const { adapter, repository, idempotencyKey } = input;
  let sourceName = "0126 Synthetic Feed";

  if (adapter.simulated) {
    if (adapter.kind !== "mock" || adapter.sourceId !== null) {
      throw new Error("simulation_boundary_violation");
    }
  } else {
    if (!adapter.sourceId) throw new Error("source_id_required");
    const source = await repository.getSourcePermission(adapter.sourceId);
    if (!sourceIsAllowed(source)) throw new Error("source_not_approved");
    sourceName = source!.name;
  }

  const started = await repository.startRun({
    sourceId: adapter.sourceId,
    sourceKey: adapter.key,
    adapterKind: adapter.kind,
    triggerType: input.triggerType ?? "manual",
    idempotencyKey,
    simulated: adapter.simulated,
  });
  if (started.duplicate) {
    return { runId: started.id, sourceKey: adapter.key, status: "skipped", simulated: adapter.simulated, fetched: 0, normalized: 0, inserted: 0, duplicates: 0, errors: [] };
  }

  const counts: RunCounts = { fetched: 0, normalized: 0, inserted: 0, duplicates: 0 };
  const errors: string[] = [];
  try {
    const items = await fetchWithRetry(adapter, input.maxAttempts ?? 3);
    counts.fetched = items.length;
    for (const item of items) {
      try {
        const normalized = normalizeFeedItem(adapter.key, adapter.sourceId, adapter.simulated, item);
        counts.normalized += 1;
        const result = await repository.saveCandidate(started.id, normalized, sourceName);
        if (result === "inserted") counts.inserted += 1;
        else counts.duplicates += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "item_processing_failed");
      }
    }
    const status = errors.length ? "partial" : "succeeded";
    await repository.finishRun(started.id, status, counts, errors);
    return { runId: started.id, sourceKey: adapter.key, status, simulated: adapter.simulated, ...counts, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ingestion_failed";
    errors.push(message);
    await repository.finishRun(started.id, "failed", counts, errors);
    return { runId: started.id, sourceKey: adapter.key, status: "failed", simulated: adapter.simulated, ...counts, errors };
  }
}

export async function runIsolatedBatch(
  jobs: Array<Parameters<typeof runIngestion>[0]>,
): Promise<RunResult[]> {
  const settled = await Promise.allSettled(jobs.map((job) => runIngestion(job)));
  return settled.map((result, index) => result.status === "fulfilled"
    ? result.value
    : {
        runId: "not-started",
        sourceKey: jobs[index].adapter.key,
        status: "failed",
        simulated: jobs[index].adapter.simulated,
        fetched: 0,
        normalized: 0,
        inserted: 0,
        duplicates: 0,
        errors: [result.reason instanceof Error ? result.reason.message : "batch_job_failed"],
      });
}
