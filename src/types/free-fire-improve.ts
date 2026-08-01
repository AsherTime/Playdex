export const FREE_FIRE_RANKS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Heroic",
  "Elite Heroic",
  "Grandmaster",
] as const;

export const FREE_FIRE_ROLES = ["Rusher", "Sniper", "Support", "IGL", "Flex"] as const;

export const FREE_FIRE_WEAKNESSES = [
  "Aim",
  "Crosshair Placement",
  "Movement / Drop Timing",
  "Spray Control",
  "Headshots / Flicks",
  "Tracking Moving Targets",
  "Ability / Gloo Wall Usage",
  "Game Sense",
  "Positioning",
  "Communication",
  "Clutching",
  "Peeking",
  "Loot / Economy Management",
  "Rotation Timing",
] as const;

export const FREE_FIRE_WEAPON_TYPES = [
  "Assault Rifle",
  "Sniper Rifle",
  "SMG",
  "Shotgun",
  "Pistol",
  "LMG",
  "Marksman Rifle",
  "Other",
] as const;

export const FREE_FIRE_LOST_CAUSES = [
  "Losing aim duels",
  "Bad positioning",
  "Poor communication",
  "Wrong Gloo Wall / ability usage",
  "Panic during fights",
  "Bad crosshair placement",
  "Lack of confidence",
  "Don't know",
] as const;

export const FREE_FIRE_MATCHES_PER_DAY = ["1", "2", "3", "4+", "Depends"] as const;

export const FREE_FIRE_PRACTICE_TIMES = [
  "15 minutes",
  "30 minutes",
  "45 minutes",
  "1 hour",
  "2+ hours",
] as const;

export const FREE_FIRE_PRACTICE_METHODS = [
  "Training Ground",
  "Clash Squad Deathmatch",
  "Custom Room Practice",
  "Sensitivity / Aim Practice Maps",
  "None",
] as const;

export const FREE_FIRE_GOALS = [
  "Reach the next rank",
  "Improve aim",
  "Improve game sense",
  "Become a better teammate",
  "Join a competitive team",
  "Play tournaments",
  "Other",
] as const;

export const FREE_FIRE_CONSISTENCY = [
  "Yes, every day",
  "Most days",
  "Only on weekends",
  "No",
] as const;

export type FreeFireRank = (typeof FREE_FIRE_RANKS)[number];
export type FreeFireRole = (typeof FREE_FIRE_ROLES)[number];
export type FreeFireWeakness = (typeof FREE_FIRE_WEAKNESSES)[number];
export type FreeFirePracticeTime = (typeof FREE_FIRE_PRACTICE_TIMES)[number];

export interface FreeFireCharacter {
  id: string;
  name: string;
}

export interface FreeFireQuestionnaire {
  rank: FreeFireRank;
  role: FreeFireRole;
  characters: string[];
  weaknesses: FreeFireWeakness[];
  bestWeaponType: string;
  lostRoundCause: string;
  matchesPerDay: string;
  practiceTime: FreeFirePracticeTime;
  practiceMethod: string;
  sensitivity: {
    general: number;
    redDot: number;
    scope2x: number;
    scope4x: number;
    sniperScope: number;
    freeLook: number;
  };
  goal: string;
  consistency: string;
}

export type FreeFireTaskModule =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export interface FreeFirePlanTask {
  id: string;
  module: FreeFireTaskModule;
  title: string;
  duration: string;
  reason: string;
}

export interface FreeFirePlanDay {
  day: number;
  label: string;
  tasks: FreeFirePlanTask[];
  unlocked: boolean;
}

export interface FreeFirePlanSummary {
  rank: FreeFireRank;
  role: FreeFireRole;
  characters: string[];
  weaknesses: FreeFireWeakness[];
  goal: string;
  practiceTime: FreeFirePracticeTime;
  taskTarget: number;
  routineSize: "short" | "medium" | "full";
  planName?: string;
}

export interface FreeFireImprovementPlan {
  createdAt: number;
  source: "generated" | "custom";
  summary: FreeFirePlanSummary;
  days: FreeFirePlanDay[];
  activeDay: number;
  completedTasks: Record<number, string[]>;
}

export interface FreeFireRecheckDraft {
  rankChanged: boolean;
  feltBetter: string;
  stillWeak: string;
}
