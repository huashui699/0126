import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessingJobRepository } from "./job-runner";
import type { ProcessingResult } from "./types";

function throwDb(error: { code?: string; message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}:${error.code ?? "unknown"}:${error.message}`);
}

export class SupabaseProcessingJobRepository implements ProcessingJobRepository {
  constructor(private readonly client: SupabaseClient) {}

  async markRunning(id: string): Promise<void> {
    const { error } = await this.client.from("ai_processing_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", id).in("status", ["queued", "failed"]);
    throwDb(error, "mark_ai_job_running");
  }

  async stageSuccess(id: string, result: ProcessingResult): Promise<void> {
    const { error } = await this.client.from("ai_processing_jobs").update({
      staged_output: result.output,
      model_provider: result.provider,
      model_id: result.modelId,
      model_version: result.modelVersion,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      estimated_cost_usd: result.estimatedCostUsd,
    }).eq("id", id).eq("status", "running");
    throwDb(error, "stage_ai_job_output");
  }

  async publishValidated(id: string, result: ProcessingResult): Promise<void> {
    const { error } = await this.client.rpc("finalize_ai_processing_job", {
      p_job_id: id,
      p_output: result.output,
      p_provider: result.provider,
      p_model_id: result.modelId,
      p_model_version: result.modelVersion,
      p_input_tokens: result.inputTokens,
      p_output_tokens: result.outputTokens,
      p_estimated_cost_usd: result.estimatedCostUsd,
    });
    throwDb(error, "finalize_ai_job");
  }

  async markFailed(id: string, code: string, message: string): Promise<void> {
    const { error } = await this.client.from("ai_processing_jobs").update({
      status: "failed", error_code: code, error_message: message, finished_at: new Date().toISOString(),
    }).eq("id", id);
    throwDb(error, "fail_ai_job");
  }
}
