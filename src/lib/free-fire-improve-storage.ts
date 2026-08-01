import type {
  FreeFireImprovementPlan,
  FreeFireQuestionnaire,
  FreeFireRecheckDraft,
} from "@/types/free-fire-improve";

const QUESTIONNAIRE_KEY = "gamedex-free-fire-improve-questionnaire";
const PLAN_KEY = "gamedex-free-fire-improve-plan";
const RECHECK_KEY = "gamedex-free-fire-improve-recheck";

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

export function loadFreeFireQuestionnaire(): FreeFireQuestionnaire | null {
  return readJson<FreeFireQuestionnaire>(QUESTIONNAIRE_KEY);
}

export function saveFreeFireQuestionnaire(questionnaire: FreeFireQuestionnaire): void {
  writeJson(QUESTIONNAIRE_KEY, questionnaire);
}

export function loadFreeFirePlan(): FreeFireImprovementPlan | null {
  return readJson<FreeFireImprovementPlan>(PLAN_KEY);
}

export function saveFreeFirePlan(plan: FreeFireImprovementPlan): void {
  writeJson(PLAN_KEY, plan);
}

export function loadFreeFireRecheck(): FreeFireRecheckDraft | null {
  return readJson<FreeFireRecheckDraft>(RECHECK_KEY);
}

export function saveFreeFireRecheck(recheck: FreeFireRecheckDraft): void {
  writeJson(RECHECK_KEY, recheck);
}

export function clearFreeFireImproveData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUESTIONNAIRE_KEY);
  window.localStorage.removeItem(PLAN_KEY);
  window.localStorage.removeItem(RECHECK_KEY);
}
