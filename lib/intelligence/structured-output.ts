import { generateText, jsonSchema, Output, type LanguageModel } from "ai";

import type { ProcessingOutput, ProcessingResult } from "./types";

export const PROCESSING_PROMPT_VERSION = "football-intelligence-v1";
export const PROCESSING_SCHEMA_VERSION = "processing-output-v1";

const processingJsonSchema = jsonSchema<ProcessingOutput>({
  type: "object",
  additionalProperties: false,
  required: ["originalLanguage", "translatedTitle", "translatedSummary", "teamIds", "people", "competitions", "infoType", "assertedBy", "eventAt", "claims"],
  properties: {
    originalLanguage: { type: "string" },
    translatedTitle: { type: "string" },
    translatedSummary: { type: "string" },
    teamIds: { type: "array", items: { type: "string" } },
    people: { type: "array", items: { type: "string" } },
    competitions: { type: "array", items: { type: "string" } },
    infoType: { type: "string", enum: ["club_announcement", "match", "player", "transfer", "coaching", "social", "media"] },
    assertedBy: { anyOf: [{ type: "string" }, { type: "null" }] },
    eventAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "subject"],
        properties: {
          text: { type: "string" },
          subject: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
      },
    },
  },
});

export const processingOutputSpec = Output.object({
  name: "FootballIntelligenceProcessingOutput",
  description: "A faithful Chinese translation, short summary, and structured football entities. Do not invent facts.",
  schema: processingJsonSchema,
});

export async function processWithAiSdk(input: {
  model: LanguageModel;
  modelId: string;
  provider: string;
  modelVersion?: string | null;
  title: string;
  content: string;
}): Promise<ProcessingResult> {
  const result = await generateText({
    model: input.model,
    output: processingOutputSpec,
    system: "Translate faithfully into concise Chinese. Preserve every number, date, person, club and uncertainty marker. Return only evidence present in the input.",
    prompt: `Title:\n${input.title}\n\nContent:\n${input.content}`,
  });

  return {
    output: result.output,
    fidelity: { passed: false, reasonCodes: ["fidelity_gate_not_run"] },
    provider: input.provider,
    modelId: input.modelId,
    modelVersion: input.modelVersion ?? null,
    inputTokens: result.usage.inputTokens ?? null,
    outputTokens: result.usage.outputTokens ?? null,
    estimatedCostUsd: null,
  };
}
