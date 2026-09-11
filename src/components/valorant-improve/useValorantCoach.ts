"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildCoachSnapshot, todaysFocus } from "@/lib/valorant-coach";
import {
  skipTask,
  startTask,
  toggleTaskComplete,
  unlockNextDays,
} from "@/lib/valorant-improve-plan";
import {
  loadPlan,
  loadQuestionnaire,
  savePlan,
} from "@/lib/valorant-improve-storage";
import {
  loadTrainingProgressFromSupabase,
  mergeCompletedTasks,
  upsertTrainingTaskProgress,
} from "@/lib/training-progress";
import type { ImproveQuestionnaire, ImprovementPlan } from "@/types/valorant-improve";

const GAME_SLUG = "valorant";

export function useValorantCoach(range: 7 | 30 | 90 = 7) {
  const router = useRouter();
  const [plan, setPlan] = useState<ImprovementPlan | null>(null);
  const [questionnaire, setQuestionnaire] = useState<ImproveQuestionnaire | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedPlan = loadPlan();
    const storedQuestions = loadQuestionnaire();
    if (!storedPlan) {
      router.replace("/games/valorant/improve");
      return;
    }

    void (async () => {
      try {
        const remote = await loadTrainingProgressFromSupabase(GAME_SLUG);
        const merged = mergeCompletedTasks(storedPlan.completedTasks, remote);
        const updated = unlockNextDays({ ...storedPlan, completedTasks: merged });
        setPlan(updated);
        savePlan(updated);
      } catch {
        setPlan(unlockNextDays(storedPlan));
      } finally {
        setQuestionnaire(storedQuestions);
        setHydrated(true);
      }
    })();
  }, [router]);

  const snapshot = useMemo(
    () => buildCoachSnapshot(questionnaire, plan, range),
    [questionnaire, plan, range],
  );
  const focus = useMemo(() => todaysFocus(snapshot.insights), [snapshot.insights]);

  const persist = (updated: ImprovementPlan) => {
    setPlan(updated);
    savePlan(updated);
  };

  const handleToggleComplete = (taskId: string) => {
    if (!plan) return;
    const day = plan.activeDay;
    const task = plan.days
      .find((entry) => entry.day === day)
      ?.tasks.find((item) => item.id === taskId);
    const updated = toggleTaskComplete(plan, day, taskId);
    persist(updated);
    void upsertTrainingTaskProgress({
      gameSlug: GAME_SLUG,
      planDay: day,
      taskId,
      taskTitle: task?.title ?? taskId,
      isCompleted: (updated.completedTasks[day] ?? []).includes(taskId),
    });
  };

  const handleStart = (taskId: string) => {
    if (!plan) return;
    persist(startTask(plan, plan.activeDay, taskId));
  };

  const handleSkip = (taskId: string) => {
    if (!plan) return;
    persist(skipTask(plan, plan.activeDay, taskId));
  };

  return {
    hydrated,
    plan,
    questionnaire,
    snapshot,
    focus,
    handleToggleComplete,
    handleStart,
    handleSkip,
  };
}
