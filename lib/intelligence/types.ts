import type { InformationType, TrustStatus } from "../../types/news";

export type ExtractedClaim = {
  text: string;
  subject: string | null;
};

export type ProcessingOutput = {
  originalLanguage: string;
  translatedTitle: string;
  translatedSummary: string;
  teamIds: string[];
  people: string[];
  competitions: string[];
  infoType: InformationType;
  assertedBy: string | null;
  eventAt: string | null;
  claims: ExtractedClaim[];
};

export type FidelityResult = {
  passed: boolean;
  reasonCodes: string[];
};

export type ProcessingResult = {
  output: ProcessingOutput;
  fidelity: FidelityResult;
  provider: string;
  modelId: string;
  modelVersion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};

export type ReliabilityInput = {
  sourceIsOfficial: boolean;
  sourceIdentityVerified: boolean;
  sourceCollectionApproved: boolean;
  directOfficialAssertion: boolean;
  isSimulated: boolean;
  hasIdentifiableSource: boolean;
  anonymousClaim: boolean;
  citationDepth: number;
  independentSourceCount: number;
  conflictingEvidence: boolean;
};

export type ReliabilityAssessment = {
  status: TrustStatus;
  reasonCodes: string[];
  explanation: string;
  requiresReview: boolean;
};
