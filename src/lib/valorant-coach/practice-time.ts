import type { PracticeTime } from "@/types/valorant-improve";

export function normalizePracticeTime(value: string | undefined): PracticeTime {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("90") || raw.includes("2+") || raw.includes("2 hour")) return "90+ min";
  if (raw.includes("60") || raw.includes("1 hour") || raw.includes("1-2") || raw.includes("45–60") || raw.includes("45-60")) {
    return "60 min";
  }
  if (raw.includes("45") || raw.includes("30")) return "45 min";
  return "20 min";
}

export function practiceBudgetMinutes(value: string | undefined): number {
  const time = normalizePracticeTime(value);
  if (time === "90+ min") return 90;
  if (time === "60 min") return 60;
  if (time === "45 min") return 45;
  return 20;
}

export function routineSizeFromTime(value: string | undefined): "short" | "medium" | "full" {
  const minutes = practiceBudgetMinutes(value);
  if (minutes <= 20) return "short";
  if (minutes <= 45) return "medium";
  return "full";
}

export function normalizeGoal(goal: string | undefined): string {
  const raw = String(goal ?? "").toLowerCase();
  if (raw.includes("aim")) return "Improve Aim";
  if (raw.includes("sense")) return "Improve Game Sense";
  if (raw.includes("consistent")) return "Become More Consistent";
  if (raw.includes("agent") || raw.includes("role") || raw.includes("master")) return "Master an Agent/Role";
  return "Rank Up";
}
