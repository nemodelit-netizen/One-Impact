export const STAGES = [
  { key: "IDENTIFIED", label: "Identified" },
  { key: "PROPOSED", label: "Proposed" },
  { key: "UNDER_REVIEW", label: "Professional review" },
  { key: "VOTING", label: "Community vote" },
  { key: "FUNDED", label: "Funding authorized" },
  { key: "IMPLEMENTING", label: "Implementation" },
  { key: "COMPLETED", label: "Completed" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"] | "REJECTED";

export function stageLabel(stage: string) {
  if (stage === "REJECTED") return "Not approved";
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}

export function stageIndex(stage: string) {
  return STAGES.findIndex((s) => s.key === stage);
}

export function nextStage(stage: string): string | null {
  const i = stageIndex(stage);
  if (i < 0 || i >= STAGES.length - 1) return null;
  return STAGES[i + 1].key;
}

export const LEDGER_TYPES = {
  CONTRIBUTION: "Member contribution",
  ALLOCATION: "Funding authorized",
  DISBURSEMENT: "Disbursed to partner",
  OPERATING_COST: "Operating cost",
  REFUND: "Refund",
} as const;

export type LedgerType = keyof typeof LEDGER_TYPES;

export const CATEGORIES: Record<string, string> = {
  WATER: "Water & sanitation",
  HEALTH: "Health",
  FOOD: "Food security",
  SHELTER: "Shelter",
  EDUCATION: "Education",
  LIVELIHOODS: "Livelihoods",
};
