import type {
  ImprovementPlan,
  PlanDay,
  PlanTask,
  PracticeTime,
  ValorantRank,
  ValorantRole,
} from "@/types/valorant-improve";
import {
  catalogTaskToPlanTask,
  type ValorantTaskTemplate,
} from "@/data/valorant-task-catalog";

const DAY_LABELS = [
  "Foundation day",
  "Consistency day",
  "Pressure day",
  "Utility day",
  "Focus day",
  "Ranked day",
  "Review day",
];

export interface ValorantCustomPlanInput {
  planName: string;
  rank: ValorantRank;
  role: ValorantRole;
  goal: string;
  practiceTime: PracticeTime;
  selectedModules: ValorantTaskTemplate[];
  customTasks: Array<{ title: string; duration: string; reason: string }>;
}

function routineSize(practiceTime: PracticeTime): ImprovementPlan["summary"]["routineSize"] {
  if (practiceTime === "15 minutes") return "short";
  if (practiceTime === "30 minutes" || practiceTime === "45 minutes") return "medium";
  return "full";
}

export function buildValorantCustomPlan(input: ValorantCustomPlanInput): ImprovementPlan {
  const days: PlanDay[] = DAY_LABELS.map((label, index) => {
    const day = index + 1;
    const catalogTasks = input.selectedModules.map((template) =>
      catalogTaskToPlanTask(template, day),
    );
    const customTasks: PlanTask[] = input.customTasks.map((task, taskIndex) => ({
      id: `custom-${taskIndex + 1}-day-${day}`,
      module: "A",
      title: task.title,
      duration: task.duration || "10 min",
      reason: task.reason || "Custom task you added to your routine.",
    }));

    return {
      day,
      label,
      tasks: [...catalogTasks, ...customTasks],
      unlocked: day === 1,
    };
  });

  return {
    createdAt: Date.now(),
    source: "custom",
    summary: {
      rank: input.rank,
      role: input.role,
      agents: [],
      weaknesses: [],
      goal: input.goal,
      practiceTime: input.practiceTime,
      routineSize: routineSize(input.practiceTime),
      planName: input.planName.trim() || "My custom Valorant plan",
    },
    days,
    activeDay: 1,
    completedTasks: {},
  };
}
