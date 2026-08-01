import type {
  ImproveQuestionnaire,
  ImprovementPlan,
  PlanDay,
  PlanSummary,
  PlanTask,
  PracticeTime,
  TaskModule,
  ValorantWeakness,
} from "@/types/valorant-improve";

const DAY_LABELS = [
  "Foundation & warmup",
  "Crosshair discipline",
  "Aim under pressure",
  "Utility mastery",
  "Positioning focus",
  "Ranked execution",
  "Review & reset",
];

function routineSize(practiceTime: PracticeTime): PlanSummary["routineSize"] {
  if (practiceTime === "15 minutes") return "short";
  if (practiceTime === "30 minutes" || practiceTime === "45 minutes") return "medium";
  return "full";
}

function aimDuration(size: PlanSummary["routineSize"]): string {
  if (size === "short") return "10 min";
  if (size === "medium") return "15 min";
  return "15 min";
}

function crosshairDuration(size: PlanSummary["routineSize"]): string {
  if (size === "short") return "5 min";
  if (size === "medium") return "10 min";
  return "15 min";
}

function utilityDuration(size: PlanSummary["routineSize"]): string {
  if (size === "short") return "10 min";
  return "15 min";
}

function reviewDuration(size: PlanSummary["routineSize"]): string {
  if (size === "short") return "5 min";
  return "10 min";
}

function rankedMatches(matchesPerDay: string, size: PlanSummary["routineSize"]): string {
  if (size === "short") return "1 match";
  if (matchesPerDay === "1" || matchesPerDay === "Depends") return "1 match";
  if (matchesPerDay === "4+") return "2 matches";
  return `${matchesPerDay} matches`;
}

function hasWeakness(weaknesses: ValorantWeakness[], items: ValorantWeakness[]): boolean {
  return items.some((item) => weaknesses.includes(item));
}

function buildTask(
  module: TaskModule,
  title: string,
  duration: string,
  reason: string,
  day: number,
): PlanTask {
  return {
    id: `${module.toLowerCase()}-day-${day}`,
    module,
    title,
    duration,
    reason,
  };
}

function buildDayTasks(
  questionnaire: ImproveQuestionnaire,
  summary: PlanSummary,
  day: number,
): PlanTask[] {
  const { weaknesses, practiceTime, matchesPerDay, agents, practiceMethod } = questionnaire;
  const size = summary.routineSize;
  const tasks: PlanTask[] = [];
  const agentLabel = agents.length ? agents.slice(0, 2).join(" / ") : "your main agents";

  const aimWeak =
    hasWeakness(weaknesses, ["Aim", "Flicks", "Tracking", "Spray Control"]) ||
    questionnaire.goal === "Improve aim";
  const crosshairWeak = hasWeakness(weaknesses, [
    "Crosshair Placement",
    "Peeking",
    "Movement",
  ]);
  const utilityWeak =
    hasWeakness(weaknesses, ["Utility Usage"]) ||
    questionnaire.lostRoundCause === "Wrong utility usage";
  const senseWeak = hasWeakness(weaknesses, [
    "Game Sense",
    "Positioning",
    "Economy Management",
  ]);
  const commWeak =
    hasWeakness(weaknesses, ["Communication"]) ||
    questionnaire.lostRoundCause === "Poor communication";

  if (aimWeak) {
    const method =
      practiceMethod !== "None" ? practiceMethod : "Practice Range";
    tasks.push(
      buildTask(
        "A",
        `Aim warm-up (${method})`,
        aimDuration(size),
        "Builds firing consistency before ranked so early duels feel controlled.",
        day,
      ),
    );
  }

  if (crosshairWeak || day === 2) {
    tasks.push(
      buildTask(
        "B",
        "Crosshair placement routine",
        crosshairDuration(size),
        "Trains head-level pre-aim so you spend less time adjusting mid-fight.",
        day,
      ),
    );
  }

  if (size !== "short" || aimWeak) {
    tasks.push(
      buildTask(
        "C",
        day % 2 === 0 ? "Team Deathmatch session" : "Deathmatch session",
        "1 match",
        "Applies mechanics under real player pressure without full ranked stakes.",
        day,
      ),
    );
  }

  if (utilityWeak || day === 4) {
    tasks.push(
      buildTask(
        "D",
        `Agent utility practice (${agentLabel})`,
        utilityDuration(size),
        "Reinforces lineup timing and ability value for your most played agents.",
        day,
      ),
    );
  }

  if (size !== "short") {
    const focus =
      day === 6
        ? "Convert practice into ranked wins"
        : questionnaire.goal === "Reach the next rank"
          ? "Play for clean round wins"
          : "Focus on one improvement per match";
    tasks.push(
      buildTask(
        "E",
        `Ranked match focus goal`,
        rankedMatches(matchesPerDay, size),
        focus,
        day,
      ),
    );
  }

  if (senseWeak || day === 7 || day === 5) {
    tasks.push(
      buildTask(
        "F",
        "Gameplay review & mistake notes",
        reviewDuration(size),
        "Locks in patterns from ranked and turns mistakes into tomorrow's focus.",
        day,
      ),
    );
  }

  if (commWeak && size === "full") {
    tasks.push(
      buildTask(
        "G",
        "Communication checklist",
        "During ranked",
        "Call info early, confirm rotates, and track ultimate usage with your team.",
        day,
      ),
    );
  }

  if (tasks.length === 0) {
    tasks.push(
      buildTask(
        "A",
        "Practice Range warm-up",
        aimDuration(size),
        "A balanced start while your plan learns more about your weaknesses.",
        day,
      ),
      buildTask(
        "E",
        "Ranked match focus goal",
        rankedMatches(matchesPerDay, size),
        "Apply one clear goal per match to build steady improvement.",
        day,
      ),
    );
  }

  if (practiceTime === "2+ hours" && !tasks.some((task) => task.module === "G")) {
    tasks.push(
      buildTask(
        "G",
        "Communication checklist",
        "During ranked",
        "Extra reps calling clears, rotates, and economy for team impact.",
        day,
      ),
    );
  }

  return tasks;
}

export function generateImprovementPlan(
  questionnaire: ImproveQuestionnaire,
): ImprovementPlan {
  const summary: PlanSummary = {
    rank: questionnaire.rank,
    role: questionnaire.role,
    agents: questionnaire.agents,
    weaknesses: questionnaire.weaknesses,
    goal: questionnaire.goal,
    practiceTime: questionnaire.practiceTime,
    routineSize: routineSize(questionnaire.practiceTime),
  };

  const days: PlanDay[] = DAY_LABELS.map((label, index) => {
    const day = index + 1;
    return {
      day,
      label,
      tasks: buildDayTasks(questionnaire, summary, day),
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

export function getDayCompletion(plan: ImprovementPlan, day: number): number {
  const dayPlan = plan.days.find((entry) => entry.day === day);
  if (!dayPlan?.tasks.length) return 0;
  const completed = plan.completedTasks[day]?.length ?? 0;
  return Math.round((completed / dayPlan.tasks.length) * 100);
}

export function isDayComplete(plan: ImprovementPlan, day: number): boolean {
  return getDayCompletion(plan, day) === 100;
}

export function unlockNextDays(plan: ImprovementPlan): ImprovementPlan {
  const days = plan.days.map((entry) => {
    if (entry.day === 1) return { ...entry, unlocked: true };
    const previousComplete = isDayComplete(plan, entry.day - 1);
    return { ...entry, unlocked: previousComplete };
  });

  return { ...plan, days };
}

export function toggleTaskComplete(
  plan: ImprovementPlan,
  day: number,
  taskId: string,
): ImprovementPlan {
  const current = plan.completedTasks[day] ?? [];
  const next = current.includes(taskId)
    ? current.filter((id) => id !== taskId)
    : [...current, taskId];

  const completedTasks = { ...plan.completedTasks, [day]: next };
  const updated: ImprovementPlan = { ...plan, completedTasks };
  return unlockNextDays(updated);
}
