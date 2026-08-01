import type {
  FreeFireImprovementPlan,
  FreeFirePlanDay,
  FreeFirePlanTask,
  FreeFirePracticeTime,
  FreeFireRank,
  FreeFireRole,
} from "@/types/free-fire-improve";
import {
  freeFireCatalogTaskToPlanTask,
  type FreeFireTaskTemplate,
} from "@/data/free-fire-task-catalog";

const DAY_LABELS = [
  "Foundation day",
  "Aim day",
  "Gloo & movement",
  "Clutch day",
  "Positioning day",
  "Ranked day",
  "Review day",
];

export interface FreeFireCustomPlanInput {
  planName: string;
  rank: FreeFireRank;
  role: FreeFireRole;
  goal: string;
  practiceTime: FreeFirePracticeTime;
  selectedModules: FreeFireTaskTemplate[];
  customTasks: Array<{ title: string; duration: string; reason: string }>;
}

function routineSize(
  practiceTime: FreeFirePracticeTime,
): FreeFireImprovementPlan["summary"]["routineSize"] {
  if (practiceTime === "15 minutes") return "short";
  if (practiceTime === "30 minutes" || practiceTime === "45 minutes") return "medium";
  return "full";
}

export function buildFreeFireCustomPlan(
  input: FreeFireCustomPlanInput,
): FreeFireImprovementPlan {
  const taskCount =
    input.selectedModules.length + input.customTasks.filter((task) => task.title.trim()).length;

  const days: FreeFirePlanDay[] = DAY_LABELS.map((label, index) => {
    const day = index + 1;
    const catalogTasks = input.selectedModules.map((template) =>
      freeFireCatalogTaskToPlanTask(template, day),
    );
    const customTasks: FreeFirePlanTask[] = input.customTasks
      .filter((task) => task.title.trim())
      .map((task, taskIndex) => ({
        id: `custom-${taskIndex + 1}-day-${day}`,
        module: "A",
        title: task.title,
        duration: task.duration || "15 min",
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
      characters: [],
      weaknesses: [],
      goal: input.goal,
      practiceTime: input.practiceTime,
      taskTarget: Math.max(taskCount, 1),
      routineSize: routineSize(input.practiceTime),
      planName: input.planName.trim() || "My custom Free Fire plan",
    },
    days,
    activeDay: 1,
    completedTasks: {},
  };
}
