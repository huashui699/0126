import { deterministicExtract, checkFidelity } from "./extract";
import type { InformationType, TrustStatus } from "../../types/news";
import type { ProcessingOutput } from "./types";
import { teams } from "../teams";

export type SyntheticEvaluation = {
  sampleCount: number;
  entityPrecision: number;
  entityRecall: number;
  classificationAccuracy: number;
  fidelityPassRate: number;
  provenance: "synthetic_contract";
};

export type ManualEvaluationSample = {
  sampleId: string;
  provenance: "human_annotated_real";
  annotatorIds: string[];
  adjudicatedBy: string;
  referenceTrustStatus: TrustStatus;
  predictedTrustStatus: TrustStatus;
  referenceTeamIds: string[];
  predictedTeamIds: string[];
  referenceClusterId: string | null;
  predictedClusterId: string | null;
  summaryFidelityPassed: boolean;
};

export type ManualEvaluationReport = {
  sampleCount: number;
  labelAgreement: number;
  greenPrecision: number | null;
  entityPrecision: number | null;
  entityRecall: number | null;
  clusterPrecision: number | null;
  summaryFidelityPassRate: number;
  provenance: "human_annotated_real";
  meetsDay41Gate: boolean;
  blockers: string[];
};

export const DAY41_THRESHOLDS = {
  minimumSamples: 300,
  labelAgreement: 0.85,
  greenPrecision: 1,
  entityPrecision: 0.95,
  entityRecall: 0.9,
  clusterPrecision: 0.9,
  summaryFidelityPassRate: 0.95,
} as const;

const templates: Array<{ type: InformationType; phrase: string; zh: string }> = [
  { type: "transfer", phrase: "signed a transfer contract", zh: "签署转会合同" },
  { type: "match", phrase: "announced a match fixture", zh: "公布比赛赛程" },
  { type: "player", phrase: "issued a player injury update", zh: "发布球员伤病更新" },
  { type: "coaching", phrase: "held an open training session", zh: "举行公开训练" },
  { type: "social", phrase: "announced a community fan event", zh: "公布社区球迷活动" },
];

export function runSyntheticEvaluation(): SyntheticEvaluation {
  let truePositive = 0;
  let predicted = 0;
  let expected = 0;
  let classificationCorrect = 0;
  let fidelityPassed = 0;

  for (let index = 0; index < 100; index += 1) {
    const team = teams[index % teams.length];
    const template = templates[index % templates.length];
    const amount = 10 + index;
    const title = `${team.nameEn} ${template.phrase} for ${amount} million on 2026-09-24`;
    const output: ProcessingOutput = {
      originalLanguage: "en",
      translatedTitle: `${team.nameZh}${template.zh}，金额 ${amount} million，日期 2026-09-24`,
      translatedSummary: "信息保持原文的不确定性。",
      teamIds: [team.id], people: [], competitions: [], infoType: template.type,
      assertedBy: team.nameEn, eventAt: "2026-09-24T00:00:00.000Z", claims: [],
    };
    const extracted = deterministicExtract(title, title);
    const actual = new Set(extracted.teamIds);
    expected += 1;
    predicted += actual.size;
    if (actual.has(team.id)) truePositive += 1;
    if (extracted.infoType === template.type) classificationCorrect += 1;
    if (checkFidelity(title, output).passed) fidelityPassed += 1;
  }

  return {
    sampleCount: 100,
    entityPrecision: predicted ? truePositive / predicted : 0,
    entityRecall: truePositive / expected,
    classificationAccuracy: classificationCorrect / 100,
    fidelityPassRate: fidelityPassed / 100,
    provenance: "synthetic_contract",
  };
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function runManualEvaluation(samples: ManualEvaluationSample[]): ManualEvaluationReport {
  const sampleIds = new Set<string>();
  let labelMatches = 0;
  let predictedGreen = 0;
  let correctGreen = 0;
  let predictedEntities = 0;
  let referenceEntities = 0;
  let correctEntities = 0;
  let fidelityPassed = 0;

  for (const sample of samples) {
    if (sample.provenance !== "human_annotated_real") throw new Error(`样本 ${sample.sampleId} 不是人工真实数据。`);
    if (!sample.sampleId.trim()) throw new Error("人工评测样本必须包含 sampleId。");
    if (sampleIds.has(sample.sampleId)) throw new Error(`人工评测样本 ID 重复：${sample.sampleId}`);
    sampleIds.add(sample.sampleId);

    const contributors = new Set([...sample.annotatorIds, sample.adjudicatedBy].filter(Boolean));
    if (contributors.size < 2) throw new Error(`样本 ${sample.sampleId} 缺少双人标注/裁决证据。`);

    if (sample.referenceTrustStatus === sample.predictedTrustStatus) labelMatches += 1;
    if (sample.predictedTrustStatus === "confirmed") {
      predictedGreen += 1;
      if (sample.referenceTrustStatus === "confirmed") correctGreen += 1;
    }

    const referenceTeams = new Set(sample.referenceTeamIds);
    const predictedTeams = new Set(sample.predictedTeamIds);
    referenceEntities += referenceTeams.size;
    predictedEntities += predictedTeams.size;
    correctEntities += [...predictedTeams].filter((teamId) => referenceTeams.has(teamId)).length;
    if (sample.summaryFidelityPassed) fidelityPassed += 1;
  }

  let predictedClusterPairs = 0;
  let correctClusterPairs = 0;
  for (let left = 0; left < samples.length; left += 1) {
    for (let right = left + 1; right < samples.length; right += 1) {
      const predictedClusterId = samples[left].predictedClusterId;
      if (!predictedClusterId || predictedClusterId !== samples[right].predictedClusterId) continue;
      predictedClusterPairs += 1;
      const referenceClusterId = samples[left].referenceClusterId;
      if (referenceClusterId && referenceClusterId === samples[right].referenceClusterId) correctClusterPairs += 1;
    }
  }

  const labelAgreement = samples.length ? labelMatches / samples.length : 0;
  const greenPrecision = ratio(correctGreen, predictedGreen);
  const entityPrecision = ratio(correctEntities, predictedEntities);
  const entityRecall = ratio(correctEntities, referenceEntities);
  const clusterPrecision = ratio(correctClusterPairs, predictedClusterPairs);
  const summaryFidelityPassRate = samples.length ? fidelityPassed / samples.length : 0;
  const blockers: string[] = [];
  if (samples.length < DAY41_THRESHOLDS.minimumSamples) blockers.push(`人工样本不足 ${DAY41_THRESHOLDS.minimumSamples} 条。`);
  if (labelAgreement < DAY41_THRESHOLDS.labelAgreement) blockers.push("标签一致率低于 85%。");
  if (greenPrecision === null) blockers.push("没有预测为绿色的样本，无法证明绿色 precision。");
  else if (greenPrecision < DAY41_THRESHOLDS.greenPrecision) blockers.push("绿色 precision 未达到 100%。");
  if (entityPrecision === null) blockers.push("没有预测球队实体，无法证明实体 precision。");
  else if (entityPrecision < DAY41_THRESHOLDS.entityPrecision) blockers.push("实体 precision 低于 95%。");
  if (entityRecall === null) blockers.push("人工集中没有球队实体，无法证明实体 recall。");
  else if (entityRecall < DAY41_THRESHOLDS.entityRecall) blockers.push("实体 recall 低于 90%。");
  if (clusterPrecision === null) blockers.push("没有预测为同簇的样本对，无法证明聚类 precision。");
  else if (clusterPrecision < DAY41_THRESHOLDS.clusterPrecision) blockers.push("聚类 precision 低于 90%。");
  if (summaryFidelityPassRate < DAY41_THRESHOLDS.summaryFidelityPassRate) blockers.push("摘要忠实率低于 95%。");

  return {
    sampleCount: samples.length,
    labelAgreement,
    greenPrecision,
    entityPrecision,
    entityRecall,
    clusterPrecision,
    summaryFidelityPassRate,
    provenance: "human_annotated_real",
    meetsDay41Gate: blockers.length === 0,
    blockers,
  };
}
