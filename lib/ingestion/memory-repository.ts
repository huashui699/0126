import { randomUUID } from "node:crypto";

import type { IngestionRepository, NormalizedItem, RunCounts, RunResult, SourcePermission } from "./types";

export class MemoryIngestionRepository implements IngestionRepository {
  readonly sources = new Map<string, SourcePermission>();
  readonly runs = new Map<string, { id: string; status: RunResult["status"] | "running"; counts?: RunCounts; errors?: string[] }>();
  readonly candidates = new Map<string, { item: NormalizedItem; sourceName: string }>();

  constructor(sources: SourcePermission[] = []) {
    for (const source of sources) this.sources.set(source.id, source);
  }

  async getSourcePermission(sourceId: string): Promise<SourcePermission | null> {
    return this.sources.get(sourceId) ?? null;
  }

  async startRun(input: { idempotencyKey: string }): Promise<{ id: string; duplicate: boolean }> {
    const existing = this.runs.get(input.idempotencyKey);
    if (existing) return { id: existing.id, duplicate: true };
    const id = randomUUID();
    this.runs.set(input.idempotencyKey, { id, status: "running" });
    return { id, duplicate: false };
  }

  async saveCandidate(_runId: string, item: NormalizedItem, sourceName: string): Promise<"inserted" | "duplicate"> {
    const key = `${item.sourceKey}:${item.externalId}`;
    if (this.candidates.has(key)) return "duplicate";
    this.candidates.set(key, { item, sourceName });
    return "inserted";
  }

  async finishRun(runId: string, status: RunResult["status"], counts: RunCounts, errors: string[]): Promise<void> {
    for (const [key, run] of this.runs) {
      if (run.id === runId) this.runs.set(key, { id: runId, status, counts, errors });
    }
  }
}
