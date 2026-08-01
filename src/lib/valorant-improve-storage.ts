import type { ImproveQuestionnaire, ImprovementPlan, RecheckDraft } from "@/types/valorant-improve";

const QUESTIONNAIRE_KEY = "gamedex-valorant-improve-questionnaire";
const PLAN_KEY = "gamedex-valorant-improve-plan";
const RECHECK_KEY = "gamedex-valorant-improve-recheck";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadQuestionnaire(): ImproveQuestionnaire | null {
  return readJson<ImproveQuestionnaire>(QUESTIONNAIRE_KEY);
}

export function saveQuestionnaire(questionnaire: ImproveQuestionnaire): void {
  writeJson(QUESTIONNAIRE_KEY, questionnaire);
}

export function loadPlan(): ImprovementPlan | null {
  return readJson<ImprovementPlan>(PLAN_KEY);
}

export function savePlan(plan: ImprovementPlan): void {
  writeJson(PLAN_KEY, plan);
}

export function loadRecheck(): RecheckDraft | null {
  return readJson<RecheckDraft>(RECHECK_KEY);
}

export function saveRecheck(recheck: RecheckDraft): void {
  writeJson(RECHECK_KEY, recheck);
}

export function clearImproveData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUESTIONNAIRE_KEY);
  window.localStorage.removeItem(PLAN_KEY);
  window.localStorage.removeItem(RECHECK_KEY);
}
