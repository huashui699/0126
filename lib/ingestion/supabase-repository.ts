import type { SupabaseClient } from "@supabase/supabase-js";

import { leagues, teams } from "../teams";
import type { IngestionRepository, NormalizedItem, RunCounts, RunResult, SourcePermission } from "./types";

type DbError = { code?: string; message: string };

function throwDb(error: DbError | null, operation: string): void {
  if (error) throw new Error(`${operation}:${error.code ?? "unknown"}:${error.message}`);
}

export class SupabaseIngestionRepository implements IngestionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getSourcePermission(sourceId: string): Promise<SourcePermission | null> {
    const { data, error } = await this.client
      .from("sources")
      .select("id,slug,name,access_status,operational_classification,collection_enabled,active,identity_verified")
      .eq("id", sourceId)
      .maybeSingle();
    throwDb(error, "source_permission");
    if (!data) return null;
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      accessStatus: data.access_status,
      operationalClassification: data.operational_classification,
      collectionEnabled: data.collection_enabled,
      active: data.active,
      identityVerified: data.identity_verified,
    };
  }

  async startRun(input: {
    sourceId: string | null;
    sourceKey: string;
    adapterKind: "mock" | "approved_feed" | "approved_api";
    triggerType: "manual" | "schedule" | "retry" | "preview";
    idempotencyKey: string;
    simulated: boolean;
  }): Promise<{ id: string; duplicate: boolean }> {
    const { data, error } = await this.client.from("ingestion_runs").insert({
      source_id: input.sourceId,
      source_key: input.sourceKey,
      adapter_kind: input.adapterKind,
      trigger_type: input.triggerType,
      idempotency_key: input.idempotencyKey,
      is_simulated: input.simulated,
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    if (error?.code === "23505") {
      const existing = await this.client.from("ingestion_runs").select("id").eq("idempotency_key", input.idempotencyKey).single();
      throwDb(existing.error, "existing_run");
      return { id: existing.data!.id, duplicate: true };
    }
    throwDb(error, "start_run");
    return { id: data!.id, duplicate: false };
  }

  async saveCandidate(runId: string, item: NormalizedItem, sourceName: string): Promise<"inserted" | "duplicate"> {
    const rawInsert = await this.client.from("raw_items").insert({
      ingestion_run_id: runId,
      source_id: item.sourceId,
      source_key: item.sourceKey,
      external_id: item.externalId,
      original_url: item.originalUrl,
      normalized_url: item.normalizedUrl,
      title: item.title,
      summary: item.summary,
      body_excerpt: item.bodyExcerpt,
      author: item.author,
      published_at: item.publishedAt,
      content_hash: item.contentHash,
      raw_payload: item.rawPayload,
      processing_status: "normalized",
      is_simulated: item.isSimulated,
    }).select("id").single();

    let rawItemId = rawInsert.data?.id as string | undefined;
    if (rawInsert.error?.code === "23505") {
      const byExternalId = await this.client
        .from("raw_items")
        .select("id")
        .eq("source_key", item.sourceKey)
        .eq("external_id", item.externalId)
        .maybeSingle();
      throwDb(byExternalId.error, "read_duplicate_raw_by_external_id");
      const byUrl = byExternalId.data ? null : await this.client
        .from("raw_items")
        .select("id")
        .eq("source_key", item.sourceKey)
        .eq("normalized_url", item.normalizedUrl)
        .maybeSingle();
      if (byUrl) throwDb(byUrl.error, "read_duplicate_raw_by_url");
      const existingRaw = byExternalId.data ?? byUrl?.data;
      if (!existingRaw) throw new Error("duplicate_raw_item_not_found");
      rawItemId = existingRaw.id;
      const existingNews = await this.client.from("news").select("id").eq("raw_item_id", rawItemId).maybeSingle();
      throwDb(existingNews.error, "read_duplicate_news");
      if (existingNews.data) {
        const publicExcerpt = item.summary ?? item.bodyExcerpt?.slice(0, 600) ?? null;
        const rawUpdate = await this.client.from("raw_items").update({
          title: item.title,
          summary: item.summary,
          body_excerpt: item.bodyExcerpt,
          published_at: item.publishedAt,
          content_hash: item.contentHash,
          raw_payload: item.rawPayload,
          processing_status: "normalized",
        }).eq("id", rawItemId);
        throwDb(rawUpdate.error, "refresh_duplicate_raw_item");

        const newsUpdate = await this.client.from("news").update({
          title: item.title,
          summary: item.summary,
          content: publicExcerpt,
          published_at: item.publishedAt,
        }).eq("id", existingNews.data.id);
        throwDb(newsUpdate.error, "refresh_duplicate_news");
        return "duplicate";
      }
    } else {
      throwDb(rawInsert.error, "insert_raw_item");
    }

    const primaryTeam = item.teamIds.length ? teams.find((team) => team.id === item.teamIds[0]) : null;
    const primaryLeague = primaryTeam ? leagues.find((league) => league.id === primaryTeam.leagueId) : null;
    const publicExcerpt = item.summary ?? item.bodyExcerpt?.slice(0, 600) ?? null;
    const newsInsert = await this.client.from("news").insert({
      raw_item_id: rawItemId!,
      source_id: item.sourceId,
      is_simulated: item.isSimulated,
      title: item.title,
      summary: item.summary,
      content: publicExcerpt,
      source: item.isSimulated ? `${sourceName} · 明确模拟` : sourceName,
      url: item.normalizedUrl,
      league: primaryLeague?.nameZh ?? null,
      team: primaryTeam?.nameZh ?? null,
      published_at: item.publishedAt,
      info_type: "media",
      trust_status: "unverified",
      trust_reason: item.isSimulated
        ? "Day 25 模拟采集验收数据，不代表真实新闻或来源判定。"
        : "来源已获采集批准；内容事实和可信度仍待后续规则评估。",
    }).select("id").single();
    throwDb(newsInsert.error, "insert_news_candidate");

    if (item.teamIds.length) {
      const relations = item.teamIds.map((teamId) => ({ news_id: newsInsert.data!.id, team_id: teamId, relationship: "subject" }));
      const relationInsert = await this.client.from("news_teams").insert(relations);
      throwDb(relationInsert.error, "insert_news_teams");
    }
    return "inserted";
  }

  async finishRun(runId: string, status: RunResult["status"], counts: RunCounts, errors: string[]): Promise<void> {
    const { data: run, error: runReadError } = await this.client
      .from("ingestion_runs")
      .select("source_id")
      .eq("id", runId)
      .single();
    throwDb(runReadError, "read_run_for_finish");

    const { error } = await this.client.from("ingestion_runs").update({
      status,
      fetched_count: counts.fetched,
      normalized_count: counts.normalized,
      inserted_count: counts.inserted,
      duplicate_count: counts.duplicates,
      error_code: errors.length ? "item_or_adapter_failure" : null,
      error_message: errors.length ? errors.slice(0, 10).join(" | ").slice(0, 2_000) : null,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
    throwDb(error, "finish_run");

    if (run!.source_id && status === "succeeded") {
      const sourceUpdate = await this.client.from("sources").update({ last_successful_run_at: new Date().toISOString() }).eq("id", run!.source_id);
      throwDb(sourceUpdate.error, "update_source_health");
    }
  }
}
