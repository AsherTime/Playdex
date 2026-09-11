import { buildCoachSnapshot, todaysFocus } from "@/lib/valorant-coach";
import {
  normalizeGoal,
  normalizePracticeTime,
  routineSizeFromTime,
} from "@/lib/valorant-coach/practice-time";
import type {
  ImproveQuestionnaire,
  ImprovementPlan,
  PlanDay,
  PlanSummary,
  PlanTask,
  PlanTaskKind,
  TaskModule,
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

const KIND_MODULE: Record<PlanTaskKind, TaskModule> = {
  warmup: "A",
  drill: "B",
  deathmatch: "C",
  utility: "D",
  ranked: "E",
  review: "F",
};

function buildTask(
  module: TaskModule,
  title: string,
  duration: string,
  reason: string,
  day: number,
  kind?: PlanTaskKind,
): PlanTask {
  return {
    id: `${(kind ?? module).toString().toLowerCase()}-day-${day}`,
    module,
    title,
    duration,
    reason,
    kind,
  };
}

export function generateImprovementPlan(questionnaire: ImproveQuestionnaire): ImprovementPlan {
  const practiceTime = normalizePracticeTime(questionnaire.practiceTime);
  const summary: PlanSummary = {
    rank: questionnaire.rank,
    role: questionnaire.role,
    agents: questionnaire.agents,
    weaknesses: questionnaire.weaknesses,
    goal: normalizeGoal(questionnaire.goal),
    practiceTime,
    routineSize: routineSizeFromTime(practiceTime),
  };

  const snapshot = buildCoachSnapshot(questionnaire, null);
  const focus = todaysFocus(snapshot.insights);

  const days: PlanDay[] = DAY_LABELS.map((label, index) => {
    const day = index + 1;
    const tasks = snapshot.recommendations.map((rec) =>
      buildTask(KIND_MODULE[rec.kind], rec.title, rec.duration, rec.reason, day, rec.kind),
    );

    if (day === 4 && !tasks.some((task) => task.kind === "utility")) {
      const agents = questionnaire.agents.slice(0, 2).join(" / ") || "your main agents";
      tasks.splice(
        Math.min(2, tasks.length),
        0,
        buildTask(
          "D",
          `Agent utility practice (${agents})`,
          "10 min",
          "One lineup or default setup so ranked utility is not improvised.",
          day,
          "utility",
        ),
      );
    }

    if (day === 7) {
      tasks.push(
        buildTask("F", "Write tomorrow's single focus", "5 min", focus, day, "review"),
      );
    }

    return { day, label, tasks, unlocked: day === 1 };
  });

  return {
    createdAt: Date.now(),
    source: "generated",
    summary,
    days,
    activeDay: 1,
    completedTasks: {},
    startedTasks: {},
    skippedTasks: {},
  };
}

export function getDayResolvedCount(plan: ImprovementPlan, day: number): number {
  const completed = plan.completedTasks[day]?.length ?? 0;
  const skipped = plan.skippedTasks?.[day]?.length ?? 0;
  return completed + skipped;
}

export function getDayCompletion(plan: ImprovementPlan, day: number): number {
  const dayPlan = plan.days.find((entry) => entry.day === day);
  if (!dayPlan?.tasks.length) return 0;
  return Math.round((getDayResolvedCount(plan, day) / dayPlan.tasks.length) * 100);
}

export function isDayComplete(plan: ImprovementPlan, day: number): boolean {
  return getDayCompletion(plan, day) === 100;
}

export function unlockNextDays(plan: ImprovementPlan): ImprovementPlan {
  const days = plan.days.map((entry) => {
    if (entry.day === 1) return { ...entry, unlocked: true };
    return { ...entry, unlocked: isDayComplete(plan, entry.day - 1) };
  });
  return { ...plan, days };
}

function toggleId(map: Record<number, string[]> | undefined, day: number, taskId: string) {
  const current = map?.[day] ?? [];
  const next = current.includes(taskId)
    ? current.filter((id) => id !== taskId)
    : [...current, taskId];
  return { ...(map ?? {}), [day]: next };
}

function withoutId(map: Record<number, string[]> | undefined, day: number, taskId: string) {
  return {
    ...(map ?? {}),
    [day]: (map?.[day] ?? []).filter((id) => id !== taskId),
  };
}

export function toggleTaskComplete(
  plan: ImprovementPlan,
  day: number,
  taskId: string,
): ImprovementPlan {
  const completedTasks = toggleId(plan.completedTasks, day, taskId);
  const skippedTasks = withoutId(plan.skippedTasks, day, taskId);
  return unlockNextDays({ ...plan, completedTasks, skippedTasks });
}

export function startTask(plan: ImprovementPlan, day: number, taskId: string): ImprovementPlan {
  if ((plan.startedTasks?.[day] ?? []).includes(taskId)) return plan;
  return {
    ...plan,
    startedTasks: toggleId(plan.startedTasks, day, taskId),
  };
}

export function skipTask(plan: ImprovementPlan, day: number, taskId: string): ImprovementPlan {
  const skippedTasks = toggleId(plan.skippedTasks, day, taskId);
  const completedTasks = withoutId(plan.completedTasks, day, taskId);
  return unlockNextDays({ ...plan, skippedTasks, completedTasks });
}
