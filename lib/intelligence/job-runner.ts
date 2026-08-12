import { checkFidelity } from "./extract";
import type { ProcessingResult } from "./types";

export type ProcessingJob = {
  id: string;
  attempt: number;
  title: string;
  content: string;
};

export interface ProcessingJobRepository {
  markRunning(id: string): Promise<void>;
  stageSuccess(id: string, result: ProcessingResult): Promise<void>;
  publishValidated(id: string, result: ProcessingResult): Promise<void>;
  markFailed(id: string, code: string, message: string): Promise<void>;
}

export type ProcessingProvider = (job: ProcessingJob) => Promise<ProcessingResult>;

export async function runProcessingJob(job: ProcessingJob, repository: ProcessingJobRepository, provider: ProcessingProvider): Promise<"succeeded" | "failed"> {
  await repository.markRunning(job.id);
  try {
    const result = await provider(job);
    const fidelity = checkFidelity(`${job.title}\n${job.content}`, result.output);
    const validated = { ...result, fidelity };
    if (!fidelity.passed) {
      await repository.markFailed(job.id, "fidelity_gate_failed", fidelity.reasonCodes.join(","));
      return "failed";
    }
    await repository.stageSuccess(job.id, validated);
    await repository.publishValidated(job.id, validated);
    return "succeeded";
  } catch (error) {
    const message = error instanceof Error ? error.message : "processing_failed";
    await repository.markFailed(job.id, "provider_or_schema_failure", message.slice(0, 2_000));
    return "failed";
  }
}
