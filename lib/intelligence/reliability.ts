import type { ReliabilityAssessment, ReliabilityInput } from "./types";

export const RELIABILITY_ENGINE_VERSION = "trust-rules-v1";

export function assessReliability(input: ReliabilityInput): ReliabilityAssessment {
  const greenGate = input.sourceIsOfficial
    && input.sourceIdentityVerified
    && input.sourceCollectionApproved
    && input.directOfficialAssertion
    && !input.isSimulated;

  if (greenGate) {
    return { status: "confirmed", reasonCodes: ["verified_official_direct"], explanation: "已验证且获准的官方来源直接声明。", requiresReview: false };
  }
  if (input.anonymousClaim || input.citationDepth >= 3 || input.conflictingEvidence) {
    const reasons = [
      ...(input.anonymousClaim ? ["anonymous_claim"] : []),
      ...(input.citationDepth >= 3 ? ["long_citation_chain"] : []),
      ...(input.conflictingEvidence ? ["conflicting_evidence"] : []),
    ];
    return { status: "rumor", reasonCodes: reasons, explanation: "证据链存在匿名、过长引用或冲突，需要人工复核。", requiresReview: true };
  }
  const reasons = [
    ...(input.isSimulated ? ["simulation_never_confirmed"] : []),
    ...(!input.hasIdentifiableSource ? ["source_not_identified"] : []),
    ...(!input.directOfficialAssertion ? ["no_direct_official_assertion"] : []),
    ...(input.independentSourceCount < 2 ? ["insufficient_independent_sources"] : []),
  ];
  return { status: "unverified", reasonCodes: reasons.length ? reasons : ["awaiting_evidence"], explanation: "来源可追溯，但尚未满足官方直接确认的硬条件。", requiresReview: !input.hasIdentifiableSource };
}
