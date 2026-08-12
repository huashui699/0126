export type AdapterKind = "mock" | "approved_feed" | "approved_api";
export type TriggerType = "manual" | "schedule" | "retry" | "preview";

export type FeedItem = {
  externalId: string;
  url: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  publishedAt: string;
  teamHints?: string[];
  raw?: Record<string, unknown>;
};

export type SourcePermission = {
  id: string;
  slug: string;
  name: string;
  accessStatus: string;
  operationalClassification: string;
  collectionEnabled: boolean;
  active: boolean;
  identityVerified: boolean;
};

export type IngestionAdapter = {
  key: string;
  kind: AdapterKind;
  sourceId: string | null;
  simulated: boolean;
  fetchItems(signal?: AbortSignal): Promise<FeedItem[]>;
};

export type NormalizedItem = {
  sourceKey: string;
  sourceId: string | null;
  externalId: string;
  originalUrl: string;
  normalizedUrl: string;
  title: string;
  summary: string | null;
  bodyExcerpt: string | null;
  author: string | null;
  publishedAt: string;
  contentHash: string;
  rawPayload: Record<string, unknown>;
  isSimulated: boolean;
  teamIds: string[];
};

export type RunStart = {
  id: string;
  duplicate: boolean;
};

export type RunCounts = {
  fetched: number;
  normalized: number;
  inserted: number;
  duplicates: number;
};

export type RunResult = RunCounts & {
  runId: string;
  sourceKey: string;
  status: "succeeded" | "partial" | "failed" | "skipped";
  simulated: boolean;
  errors: string[];
};

export interface IngestionRepository {
  getSourcePermission(sourceId: string): Promise<SourcePermission | null>;
  startRun(input: {
    sourceId: string | null;
    sourceKey: string;
    adapterKind: AdapterKind;
    triggerType: TriggerType;
    idempotencyKey: string;
    simulated: boolean;
  }): Promise<RunStart>;
  saveCandidate(runId: string, item: NormalizedItem, sourceName: string): Promise<"inserted" | "duplicate">;
  finishRun(runId: string, status: RunResult["status"], counts: RunCounts, errors: string[]): Promise<void>;
}
