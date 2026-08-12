import assert from "node:assert/strict";
import test from "node:test";

import { assessSourceIndependence, canonicalizeUrl, compareForClustering } from "../../lib/intelligence/clustering";
import { checkFidelity, deterministicExtract, matchTeamIds } from "../../lib/intelligence/extract";
import { runManualEvaluation, runSyntheticEvaluation, type ManualEvaluationSample } from "../../lib/intelligence/evaluation";
import { runProcessingJob, type ProcessingJobRepository } from "../../lib/intelligence/job-runner";
import { assessReliability } from "../../lib/intelligence/reliability";
import type { ProcessingResult } from "../../lib/intelligence/types";
import { teams } from "../../lib/teams";

function validResult(overrides: Partial<ProcessingResult> = {}): ProcessingResult {
  return {
    output: {
      originalLanguage: "zh", translatedTitle: "曼城在 2026-09-24 公布 25 人名单", translatedSummary: "曼城公布 25 人名单。",
      teamIds: [teams[3].id], people: [], competitions: [], infoType: "match", assertedBy: "曼城", eventAt: "2026-09-24T00:00:00.000Z", claims: [],
    },
    fidelity: { passed: false, reasonCodes: [] }, provider: "fixture", modelId: "fixture-v1", modelVersion: "1", inputTokens: null, outputTokens: null, estimatedCostUsd: 0,
    ...overrides,
  };
}

test("extracts multiple teams, type and explicit event date", () => {
  const text = "Arsenal and Chelsea announced a match on 2026-09-24";
  const result = deterministicExtract(text, text);
  assert.deepEqual(new Set(result.teamIds), new Set([teams[5].id, teams[2].id]));
  assert.equal(result.infoType, "match");
  assert.equal(result.eventAt, "2026-09-24T00:00:00.000Z");
});

test("team matcher does not treat a substring as a club", () => {
  assert.deepEqual(matchTeamIds("The city council met today"), []);
});

test("fidelity gate rejects missing numbers and invented teams", () => {
  const result = validResult().output;
  assert.equal(checkFidelity("曼城在 2026-09-24 公布 25 人名单", result).passed, true);
  assert.deepEqual(checkFidelity("曼城公布 26 人名单", result).reasonCodes.sort(), ["number_mismatch"].sort());
});

test("100-case dataset is explicitly synthetic and clears contract thresholds", () => {
  const report = runSyntheticEvaluation();
  assert.equal(report.provenance, "synthetic_contract");
  assert.equal(report.sampleCount, 100);
  assert.ok(report.entityPrecision >= 0.95);
  assert.ok(report.entityRecall >= 0.9);
  assert.ok(report.classificationAccuracy >= 0.95);
  assert.ok(report.fidelityPassRate >= 0.95);
});

test("day 41 gate accepts 300 adjudicated real samples only when hard thresholds pass", () => {
  const samples: ManualEvaluationSample[] = Array.from({ length: 300 }, (_, index) => ({
    sampleId: `real-${index + 1}`,
    provenance: "human_annotated_real",
    annotatorIds: ["annotator-a"],
    adjudicatedBy: "annotator-b",
    referenceTrustStatus: index % 3 === 0 ? "confirmed" : "unverified",
    predictedTrustStatus: index % 3 === 0 ? "confirmed" : "unverified",
    referenceTeamIds: [teams[index % teams.length].id],
    predictedTeamIds: [teams[index % teams.length].id],
    referenceClusterId: `cluster-${Math.floor(index / 2)}`,
    predictedClusterId: `cluster-${Math.floor(index / 2)}`,
    summaryFidelityPassed: true,
  }));
  const report = runManualEvaluation(samples);
  assert.equal(report.sampleCount, 300);
  assert.equal(report.greenPrecision, 1);
  assert.equal(report.clusterPrecision, 1);
  assert.equal(report.meetsDay41Gate, true);
  assert.deepEqual(report.blockers, []);
});

test("day 41 gate does not treat missing green or cluster evidence as a pass", () => {
  const sample: ManualEvaluationSample = {
    sampleId: "real-1", provenance: "human_annotated_real", annotatorIds: ["annotator-a"], adjudicatedBy: "annotator-b",
    referenceTrustStatus: "unverified", predictedTrustStatus: "unverified", referenceTeamIds: [], predictedTeamIds: [],
    referenceClusterId: null, predictedClusterId: null, summaryFidelityPassed: true,
  };
  const report = runManualEvaluation([sample]);
  assert.equal(report.meetsDay41Gate, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("绿色 precision")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("聚类 precision")));
});

test("day 41 gate blocks entity and summary quality regressions", () => {
  const samples: ManualEvaluationSample[] = Array.from({ length: 300 }, (_, index) => ({
    sampleId: `quality-${index + 1}`, provenance: "human_annotated_real", annotatorIds: ["annotator-a"], adjudicatedBy: "annotator-b",
    referenceTrustStatus: index % 2 === 0 ? "confirmed" : "unverified",
    predictedTrustStatus: index % 2 === 0 ? "confirmed" : "unverified",
    referenceTeamIds: [teams[index % teams.length].id], predictedTeamIds: index < 31 ? [] : [teams[index % teams.length].id],
    referenceClusterId: `cluster-${Math.floor(index / 2)}`, predictedClusterId: `cluster-${Math.floor(index / 2)}`,
    summaryFidelityPassed: index >= 20,
  }));
  const report = runManualEvaluation(samples);
  assert.equal(report.meetsDay41Gate, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("实体 recall")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("摘要忠实率")));
});

test("URL and title clustering preserve explainable methods", () => {
  const base = { id: "a", normalizedUrl: "https://example.com/story?utm_source=x", title: "Arsenal complete player signing today", sourceId: "one", sourceDomain: "example.com" };
  assert.equal(canonicalizeUrl(base.normalizedUrl), "https://example.com/story");
  assert.equal(compareForClustering(base, { ...base, id: "b", normalizedUrl: "https://example.com/story" }).method, "canonical_url");
  assert.equal(compareForClustering(base, { ...base, id: "c", normalizedUrl: "https://other.test/a", title: "Arsenal complete player signing today confirmed" }).method, "title_similarity");
});

test("citation chain is not counted as independent confirmation", () => {
  const left = { id: "a", normalizedUrl: "https://a.test/1", title: "A", sourceId: "one", sourceDomain: "a.test", citesNewsId: "b" };
  const right = { id: "b", normalizedUrl: "https://b.test/1", title: "B", sourceId: "two", sourceDomain: "b.test" };
  assert.deepEqual(assessSourceIndependence(left, right), { independent: false, reason: "direct_citation_chain" });
});

test("green status requires every official hard gate and rejects simulation", () => {
  const official = { sourceIsOfficial: true, sourceIdentityVerified: true, sourceCollectionApproved: true, directOfficialAssertion: true, isSimulated: false, hasIdentifiableSource: true, anonymousClaim: false, citationDepth: 0, independentSourceCount: 1, conflictingEvidence: false };
  assert.equal(assessReliability(official).status, "confirmed");
  assert.equal(assessReliability({ ...official, isSimulated: true }).status, "unverified");
  assert.equal(assessReliability({ ...official, sourceIsOfficial: false, anonymousClaim: true }).status, "rumor");
});

test("failed model output never publishes formal fields", async () => {
  const calls: string[] = [];
  const repository: ProcessingJobRepository = {
    markRunning: async () => { calls.push("running"); },
    stageSuccess: async () => { calls.push("staged"); },
    publishValidated: async () => { calls.push("published"); },
    markFailed: async () => { calls.push("failed"); },
  };
  const status = await runProcessingJob({ id: "job", attempt: 1, title: "曼城公布 26 人名单", content: "" }, repository, async () => validResult());
  assert.equal(status, "failed");
  assert.deepEqual(calls, ["running", "failed"]);
});

test("validated output stages before atomic publication", async () => {
  const calls: string[] = [];
  const repository: ProcessingJobRepository = {
    markRunning: async () => { calls.push("running"); }, stageSuccess: async () => { calls.push("staged"); },
    publishValidated: async () => { calls.push("published"); }, markFailed: async () => { calls.push("failed"); },
  };
  const job = { id: "job", attempt: 1, title: "曼城在 2026-09-24 公布 25 人名单", content: "" };
  assert.equal(await runProcessingJob(job, repository, async () => validResult()), "succeeded");
  assert.deepEqual(calls, ["running", "staged", "published"]);
});
