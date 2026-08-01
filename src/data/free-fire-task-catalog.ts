import type { FreeFirePlanTask, FreeFireTaskModule } from "@/types/free-fire-improve";

export interface FreeFireTaskTemplate {
  module: FreeFireTaskModule;
  title: string;
  duration: string;
  reason: string;
}

export const FREE_FIRE_TASK_CATALOG: FreeFireTaskTemplate[] = [
  {
    module: "A",
    title: "Training Ground aim warm-up",
    duration: "15 min",
    reason: "Builds spray confidence and first-shot accuracy before ranked fights.",
  },
  {
    module: "B",
    title: "Headshot practice with moving targets",
    duration: "15 min",
    reason: "Trains flick timing and head-level tracking against moving bots.",
  },
  {
    module: "C",
    title: "Drag & accuracy practice",
    duration: "15 min",
    reason: "Locks recoil control so mid-range sprays stay on target.",
  },
  {
    module: "D",
    title: "Gloo wall placement & speed",
    duration: "15 min",
    reason: "Builds faster, safer gloo timing for peeks, covers, and clutch saves.",
  },
  {
    module: "E",
    title: "Movement jump / slide / strafing",
    duration: "15 min",
    reason: "Improves drop timing, peek angles, and fight mobility.",
  },
  {
    module: "F",
    title: "1v1 custom room",
    duration: "3 matches",
    reason: "Forces calm peeks and clutch decisions under direct pressure.",
  },
  {
    module: "G",
    title: "Clash Squad ranked focus",
    duration: "2–3 matches",
    reason: "Converts practice into short ranked reps with one clear focus per match.",
  },
  {
    module: "H",
    title: "Battle Royale ranked focus",
    duration: "2 matches",
    reason: "Applies rotations, mid-game positioning, and end-circle composure.",
  },
  {
    module: "I",
    title: "Utility practice: grenades & gloo walls",
    duration: "20 min",
    reason: "Sharpens grenade timing and gloo setups for entry and defense.",
  },
  {
    module: "J",
    title: "Positioning, rotation & game sense",
    duration: "20 min",
    reason: "Reviews zone pathing, high-ground fights, and safer rotate timings.",
  },
  {
    module: "K",
    title: "Gameplay review / mistake analysis",
    duration: "20 min",
    reason: "Notes one mistake per lost fight and turns it into tomorrow's focus.",
  },
  {
    module: "L",
    title: "Team communication checklist",
    duration: "During ranked",
    reason: "Call enemy count, gloo usage, rotates, and revive priority every fight.",
  },
];

export function freeFireCatalogTaskToPlanTask(
  template: FreeFireTaskTemplate,
  day: number,
): FreeFirePlanTask {
  return {
    id: `${template.module.toLowerCase()}-day-${day}`,
    module: template.module,
    title: template.title,
    duration: template.duration,
    reason: template.reason,
  };
}
