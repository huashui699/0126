import { teams } from "../teams";
import type { InformationType } from "../../types/news";
import type { FidelityResult, ProcessingOutput } from "./types";

const CJK_PATTERN = /[\u3400-\u9fff]/u;
const CYRILLIC_PATTERN = /[\u0400-\u04ff]/u;
const ISO_DATE_PATTERN = /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?\b/u;
const NUMBER_PATTERN = /\b\d+(?:[.,]\d+)?\b/gu;
const AMBIGUOUS_SINGLE_WORD_ALIASES = new Set(["city", "united", "inter", "om", "reds", "blues"]);

const typeRules: Array<[InformationType, RegExp]> = [
  ["transfer", /transfer|sign(?:ed|ing)?|contract|renew|loan|转会|签约|续约|租借/iu],
  ["match", /match|fixture|kick-?off|line-?up|score|比赛|赛程|开球|阵容/iu],
  ["player", /injur|fitness|player|伤病|球员|复出/iu],
  ["coaching", /coach|training|manager|教练|训练/iu],
  ["social", /community|fan event|charity|社区|球迷|公益/iu],
  ["club_announcement", /announce|statement|official|公告|声明|官方/iu],
];

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function aliasMatches(text: string, alias: string): boolean {
  const haystack = ` ${normalize(text)} `;
  const needle = normalize(alias);
  if (!needle) return false;
  if (CJK_PATTERN.test(needle)) return haystack.includes(needle);
  if (AMBIGUOUS_SINGLE_WORD_ALIASES.has(needle)) return false;
  return haystack.includes(` ${needle} `);
}

export function detectLanguage(text: string): string {
  if (CJK_PATTERN.test(text)) return "zh";
  if (CYRILLIC_PATTERN.test(text)) return "ru";
  if (/[áéíóúñ¿¡]/iu.test(text)) return "es";
  if (/[äöüß]/iu.test(text)) return "de";
  if (/[àâçéèêëîïôûùüÿœ]/iu.test(text)) return "fr";
  if (/[àèéìíîòóùú]/iu.test(text)) return "it";
  return "en";
}

export function matchTeamIds(text: string): string[] {
  return teams.flatMap((team) => {
    const names = [team.nameZh, team.nameEn, team.shortNameZh, team.shortNameEn, ...team.aliases]
      .slice().sort((a, b) => b.length - a.length);
    return names.some((name) => aliasMatches(text, name)) ? [team.id] : [];
  });
}

export function classifyInformationType(text: string): InformationType {
  return typeRules.find(([, pattern]) => pattern.test(text))?.[0] ?? "media";
}

export function extractEventAt(text: string): string | null {
  const match = text.match(ISO_DATE_PATTERN)?.[0];
  if (!match) return null;
  const normalized = match.includes("T") || match.includes(" ") ? match.replace(" ", "T") : `${match}T00:00:00Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function checkFidelity(source: string, output: ProcessingOutput): FidelityResult {
  const sourceNumbers = [...new Set((source.match(NUMBER_PATTERN) ?? []).map((value) => value.replace(",", ".")))].sort();
  const outputText = `${output.translatedTitle} ${output.translatedSummary}`;
  const outputNumbers = [...new Set((outputText.match(NUMBER_PATTERN) ?? []).map((value) => value.replace(",", ".")))].sort();
  const sourceTeams = new Set(matchTeamIds(source));
  const outputTeams = new Set(output.teamIds);
  const reasonCodes: string[] = [];
  if (sourceNumbers.join("|") !== outputNumbers.join("|")) reasonCodes.push("number_mismatch");
  if ([...outputTeams].some((id) => !sourceTeams.has(id))) reasonCodes.push("invented_team");
  if ([...sourceTeams].some((id) => !outputTeams.has(id))) reasonCodes.push("missing_team");
  if (!output.translatedTitle.trim() || !output.translatedSummary.trim()) reasonCodes.push("empty_translation");
  return { passed: reasonCodes.length === 0, reasonCodes };
}

export function deterministicExtract(title: string, content: string): Pick<ProcessingOutput, "originalLanguage" | "teamIds" | "infoType" | "eventAt"> {
  const combined = `${title}\n${content}`;
  return {
    originalLanguage: detectLanguage(combined),
    teamIds: matchTeamIds(combined),
    infoType: classifyInformationType(combined),
    eventAt: extractEventAt(combined),
  };
}
