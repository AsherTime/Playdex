import type { PlanTask, TaskModule } from "@/types/valorant-improve";

export interface ValorantTaskTemplate {
  module: TaskModule;
  title: string;
  duration: string;
  reason: string;
}

export const VALORANT_TASK_CATALOG: ValorantTaskTemplate[] = [
  {
    module: "A",
    title: "Aim warm-up",
    duration: "15 min",
    reason: "Builds firing consistency before ranked so early duels feel controlled.",
  },
  {
    module: "B",
    title: "Crosshair placement routine",
    duration: "10 min",
    reason: "Trains head-level pre-aim so you spend less time adjusting mid-fight.",
  },
  {
    module: "C",
    title: "Deathmatch / Team Deathmatch",
    duration: "1 match",
    reason: "Applies mechanics under real player pressure without full ranked stakes.",
  },
  {
    module: "D",
    title: "Agent utility practice",
    duration: "15 min",
    reason: "Reinforces lineup timing and ability value for your most played agents.",
  },
  {
    module: "E",
    title: "Ranked match focus goal",
    duration: "1–2 matches",
    reason: "Convert practice into ranked with one clear improvement goal per match.",
  },
  {
    module: "F",
    title: "Gameplay review / mistake notes",
    duration: "10 min",
    reason: "Locks in patterns from ranked and turns mistakes into tomorrow's focus.",
  },
  {
    module: "G",
    title: "Communication checklist",
    duration: "During ranked",
    reason: "Call info early, confirm rotates, and track ultimate usage with your team.",
  },
];

export function catalogTaskToPlanTask(
  template: ValorantTaskTemplate,
  day: number,
): PlanTask {
  return {
    id: `${template.module.toLowerCase()}-day-${day}`,
    module: template.module,
    title: template.title,
    duration: template.duration,
    reason: template.reason,
  };
}
