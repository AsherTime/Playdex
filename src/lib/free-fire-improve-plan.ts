import { FREE_FIRE_CHARACTERS } from "@/data/free-fire-characters";
import type {
  FreeFireImprovementPlan,
  FreeFirePlanDay,
  FreeFirePlanSummary,
  FreeFirePlanTask,
  FreeFirePracticeTime,
  FreeFireQuestionnaire,
  FreeFireTaskModule,
  FreeFireWeakness,
} from "@/types/free-fire-improve";

const DAY_LABELS = [
  "Foundation & warmup",
  "Aim discipline",
  "Movement & gloo",
  "Clutch pressure",
  "Positioning focus",
  "Ranked execution",
  "Review & reset",
];

function taskTarget(practiceTime: FreeFirePracticeTime): number {
  switch (practiceTime) {
    case "15 minutes":
      return 2;
    case "30 minutes":
      return 3;
    case "45 minutes":
      return 4;
    case "1 hour":
      return 5;
    case "2+ hours":
      return 7;
  }
}

function routineSize(practiceTime: FreeFirePracticeTime): FreeFirePlanSummary["routineSize"] {
  if (practiceTime === "15 minutes") return "short";
  if (practiceTime === "30 minutes" || practiceTime === "45 minutes") return "medium";
  return "full";
}

function hasWeakness(weaknesses: FreeFireWeakness[], items: FreeFireWeakness[]): boolean {
  return items.some((item) => weaknesses.includes(item));
}

function buildTask(
  module: FreeFireTaskModule,
  title: string,
  duration: string,
  reason: string,
  day: number,
): FreeFirePlanTask {
  return {
    id: `${module.toLowerCase()}-day-${day}`,
    module,
    title,
    duration,
    reason,
  };
}

function candidateTasks(
  questionnaire: FreeFireQuestionnaire,
  day: number,
): FreeFirePlanTask[] {
  const { weaknesses, characters, practiceMethod, lostRoundCause, goal, matchesPerDay } =
    questionnaire;
  const candidates: FreeFirePlanTask[] = [];
  const characterLabel = characters.length
    ? characters
        .slice(0, 2)
        .map(
          (id) =>
            FREE_FIRE_CHARACTERS.find((character) => character.id === id)?.name ?? id,
        )
        .join(" / ")
    : "your mains";

  const method =
    practiceMethod !== "None" ? practiceMethod : "Training Ground";

  if (
    hasWeakness(weaknesses, ["Aim", "Crosshair Placement", "Tracking Moving Targets"]) ||
    goal === "Improve aim"
  ) {
    candidates.push(
      buildTask(
        "A",
        `Training Ground aim warm-up (${method})`,
        "15 min",
        "Builds spray confidence and first-shot accuracy before ranked fights.",
        day,
      ),
    );
  }

  if (hasWeakness(weaknesses, ["Headshots / Flicks"])) {
    candidates.push(
      buildTask(
        "B",
        "Headshot practice with moving targets",
        "15 min",
        "Trains flick timing and head-level tracking against moving bots.",
        day,
      ),
    );
  }

  if (hasWeakness(weaknesses, ["Spray Control"])) {
    candidates.push(
      buildTask(
        "C",
        "Drag & accuracy practice",
        "15 min",
        "Locks recoil control so mid-range sprays stay on target.",
        day,
      ),
    );
  }

  if (
    hasWeakness(weaknesses, ["Ability / Gloo Wall Usage"]) ||
    lostRoundCause === "Wrong Gloo Wall / ability usage"
  ) {
    candidates.push(
      buildTask(
        "D",
        `Gloo wall placement & speed (${characterLabel})`,
        "15 min",
        "Builds faster, safer gloo timing for peeks, covers, and clutch saves.",
        day,
      ),
    );
  }

  if (hasWeakness(weaknesses, ["Movement / Drop Timing"])) {
    candidates.push(
      buildTask(
        "E",
        "Movement jump / slide / strafing",
        "15 min",
        "Improves drop timing, peek angles, and fight mobility.",
        day,
      ),
    );
  }

  if (hasWeakness(weaknesses, ["Clutching", "Peeking"])) {
    candidates.push(
      buildTask(
        "F",
        "1v1 custom room",
        "3 matches",
        "Forces calm peeks and clutch decisions under direct pressure.",
        day,
      ),
    );
  }

  if (hasWeakness(weaknesses, ["Game Sense", "Positioning", "Rotation Timing"])) {
    candidates.push(
      buildTask(
        "J",
        "Positioning, rotation & game sense",
        "20 min",
        "Reviews zone pathing, high-ground fights, and safer rotate timings.",
        day,
      ),
    );
  }

  if (hasWeakness(weaknesses, ["Loot / Economy Management"]) || day === 4) {
    candidates.push(
      buildTask(
        "I",
        "Utility practice: grenades & gloo walls",
        "20 min",
        "Sharpens grenade timing and gloo setups for entry and defense.",
        day,
      ),
    );
  }

  if (
    hasWeakness(weaknesses, ["Communication"]) ||
    lostRoundCause === "Poor communication"
  ) {
    candidates.push(
      buildTask(
        "L",
        "Team communication checklist",
        "During ranked",
        "Call enemy count, gloo usage, rotates, and revive priority every fight.",
        day,
      ),
    );
  }

  // Day-specific ranked / review modules for fuller routines
  if (day === 3 || day === 6 || goal === "Reach the next rank") {
    candidates.push(
      buildTask(
        "G",
        "Clash Squad ranked focus",
        matchesPerDay === "1" ? "2 matches" : "2–3 matches",
        "Converts practice into short ranked reps with one clear focus per match.",
        day,
      ),
    );
  }

  if (day === 5 || day === 6) {
    candidates.push(
      buildTask(
        "H",
        "Battle Royale ranked focus",
        "2 matches",
        "Applies rotations, mid-game positioning, and end-circle composure.",
        day,
      ),
    );
  }

  if (day === 7 || day === 5) {
    candidates.push(
      buildTask(
        "K",
        "Gameplay review / mistake analysis",
        "20 min",
        "Notes one mistake per lost fight and turns it into tomorrow's focus.",
        day,
      ),
    );
  }

  if (candidates.length === 0) {
    candidates.push(
      buildTask(
        "A",
        "Training Ground aim warm-up",
        "15 min",
        "A balanced start while your plan learns more about your weaknesses.",
        day,
      ),
      buildTask(
        "J",
        "Positioning, rotation & game sense",
        "20 min",
        "Builds safer habits for ranked circles and team fights.",
        day,
      ),
    );
  }

  return candidates;
}

function pickTasks(
  candidates: FreeFirePlanTask[],
  target: number,
  practiceTime: FreeFirePracticeTime,
): FreeFirePlanTask[] {
  // Prefer unique modules; fill up to target count
  const unique: FreeFirePlanTask[] = [];
  const seen = new Set<string>();

  for (const task of candidates) {
    if (seen.has(task.module)) continue;
    seen.add(task.module);
    unique.push(task);
    if (unique.length >= target) break;
  }

  // Full routines (2+ hours) keep ranked/custom room modules when available
  if (practiceTime === "2+ hours") {
    const ranked = candidates.filter(
      (task) =>
        (task.module === "F" ||
          task.module === "G" ||
          task.module === "H" ||
          task.module === "K") &&
        !unique.some((picked) => picked.module === task.module),
    );
    for (const task of ranked) {
      unique.push(task);
      if (unique.length >= target) break;
    }
  }

  return unique.slice(0, target);
}

export function generateFreeFirePlan(
  questionnaire: FreeFireQuestionnaire,
): FreeFireImprovementPlan {
  const target = taskTarget(questionnaire.practiceTime);
  const summary: FreeFirePlanSummary = {
    rank: questionnaire.rank,
    role: questionnaire.role,
    characters: questionnaire.characters,
    weaknesses: questionnaire.weaknesses,
    goal: questionnaire.goal,
    practiceTime: questionnaire.practiceTime,
    taskTarget: target,
    routineSize: routineSize(questionnaire.practiceTime),
  };

  const days: FreeFirePlanDay[] = DAY_LABELS.map((label, index) => {
    const day = index + 1;
    const candidates = candidateTasks(questionnaire, day);
    return {
      day,
      label,
      tasks: pickTasks(candidates, target, questionnaire.practiceTime),
      unlocked: day === 1,
    };
  });

  return {
    createdAt: Date.now(),
    source: "generated",
    summary,
    days,
    activeDay: 1,
    completedTasks: {},
  };
}

export function getFreeFireDayCompletion(
  plan: FreeFireImprovementPlan,
  day: number,
): number {
  const dayPlan = plan.days.find((entry) => entry.day === day);
  if (!dayPlan?.tasks.length) return 0;
  const completed = plan.completedTasks[day]?.length ?? 0;
  return Math.round((completed / dayPlan.tasks.length) * 100);
}

export function isFreeFireDayComplete(
  plan: FreeFireImprovementPlan,
  day: number,
): boolean {
  return getFreeFireDayCompletion(plan, day) === 100;
}

export function unlockFreeFireNextDays(
  plan: FreeFireImprovementPlan,
): FreeFireImprovementPlan {
  const days = plan.days.map((entry) => {
    if (entry.day === 1) return { ...entry, unlocked: true };
    return {
      ...entry,
      unlocked: isFreeFireDayComplete(plan, entry.day - 1),
    };
  });
  return { ...plan, days };
}

export function toggleFreeFireTaskComplete(
  plan: FreeFireImprovementPlan,
  day: number,
  taskId: string,
): FreeFireImprovementPlan {
  const current = plan.completedTasks[day] ?? [];
  const next = current.includes(taskId)
    ? current.filter((id) => id !== taskId)
    : [...current, taskId];

  return unlockFreeFireNextDays({
    ...plan,
    completedTasks: { ...plan.completedTasks, [day]: next },
  });
}
