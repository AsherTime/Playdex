export const VALORANT_RANKS = [
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Ascendant",
  "Immortal",
  "Radiant",
] as const;

export const VALORANT_ROLES = [
  "Duelist",
  "Initiator",
  "Controller",
  "Sentinel",
  "Flex",
] as const;

export const VALORANT_WEAKNESSES = [
  "Aim",
  "Crosshair Placement",
  "Movement",
  "Spray Control",
  "Flicks",
  "Tracking",
  "Utility Usage",
  "Game Sense",
  "Positioning",
  "Communication",
  "Clutching",
  "Peeking",
  "Economy Management",
] as const;

export const VALORANT_WEAPONS = [
  "Vandal",
  "Phantom",
  "Sheriff",
  "Guardian",
  "Operator",
  "Spectre",
  "Other",
] as const;

export const LOST_ROUND_CAUSES = [
  "Losing aim duels",
  "Bad positioning",
  "Poor communication",
  "Wrong utility usage",
  "Panic during fights",
  "Bad crosshair placement",
  "Lack of confidence",
  "Don't know",
] as const;

export const MATCHES_PER_DAY = ["1", "2", "3", "4+", "Depends"] as const;

export const PRACTICE_TIMES = [
  "15 minutes",
  "30 minutes",
  "45 minutes",
  "1 hour",
  "2+ hours",
] as const;

export const PRACTICE_METHODS = [
  "Aim Labs",
  "KovaaK's",
  "Deathmatch",
  "Team Deathmatch",
  "Practice Range",
  "Custom Maps",
  "None",
] as const;

export const IMPROVE_GOALS = [
  "Reach the next rank",
  "Improve aim",
  "Improve game sense",
  "Become a better teammate",
  "Join a competitive team",
  "Play tournaments",
  "Other",
] as const;

export const CONSISTENCY_OPTIONS = [
  "Yes, every day",
  "Most days",
  "Only on weekends",
  "No",
] as const;

export type ValorantRank = (typeof VALORANT_RANKS)[number];
export type ValorantRole = (typeof VALORANT_ROLES)[number];
export type ValorantWeakness = (typeof VALORANT_WEAKNESSES)[number];
export type PracticeTime = (typeof PRACTICE_TIMES)[number];

export interface ValorantAgent {
  id: string;
  name: string;
  role: Exclude<ValorantRole, "Flex">;
}

export interface ImproveQuestionnaire {
  rank: ValorantRank;
  role: ValorantRole;
  agents: string[];
  weaknesses: ValorantWeakness[];
  bestWeapon: string;
  lostRoundCause: string;
  matchesPerDay: string;
  practiceTime: PracticeTime;
  practiceMethod: string;
  dpi: number;
  sensitivity: number;
  scopedSensitivity?: number;
  goal: string;
  consistency: string;
}

export type TaskModule = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface PlanTask {
  id: string;
  module: TaskModule;
  title: string;
  duration: string;
  reason: string;
}

export interface PlanDay {
  day: number;
  label: string;
  tasks: PlanTask[];
  unlocked: boolean;
}

export interface PlanSummary {
  rank: ValorantRank;
  role: ValorantRole;
  agents: string[];
  weaknesses: ValorantWeakness[];
  goal: string;
  practiceTime: PracticeTime;
  routineSize: "short" | "medium" | "full";
  planName?: string;
}

export interface ImprovementPlan {
  createdAt: number;
  source: "generated" | "custom";
  summary: PlanSummary;
  days: PlanDay[];
  activeDay: number;
  completedTasks: Record<number, string[]>;
}

export interface RecheckDraft {
  rankChanged: boolean;
  feltBetter: string;
  stillWeak: string;
}
