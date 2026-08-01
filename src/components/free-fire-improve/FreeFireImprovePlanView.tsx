"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FREE_FIRE_CHARACTERS } from "@/data/free-fire-characters";
import {
  getFreeFireDayCompletion,
  isFreeFireDayComplete,
  toggleFreeFireTaskComplete,
  unlockFreeFireNextDays,
} from "@/lib/free-fire-improve-plan";
import {
  loadFreeFirePlan,
  loadFreeFireRecheck,
  saveFreeFirePlan,
  saveFreeFireRecheck,
} from "@/lib/free-fire-improve-storage";
import {
  loadTrainingProgressFromSupabase,
  mergeCompletedTasks,
  upsertTrainingTaskProgress,
} from "@/lib/training-progress";
import {
  FreeFireImproveCard,
  FreeFireProgressBar,
} from "@/components/free-fire-improve/FreeFireImproveShell";
import { FreeFireRankBadge } from "@/components/free-fire-improve/FreeFireRankBadge";
import type {
  FreeFireImprovementPlan,
  FreeFireRecheckDraft,
} from "@/types/free-fire-improve";

const DEFAULT_RECHECK: FreeFireRecheckDraft = {
  rankChanged: false,
  feltBetter: "",
  stillWeak: "",
};
const GAME_SLUG = "free-fire";

export function FreeFireImprovePlanView() {
  const router = useRouter();
  const [plan, setPlan] = useState<FreeFireImprovementPlan | null>(null);
  const [recheck, setRecheck] = useState<FreeFireRecheckDraft>(() =>
    typeof window !== "undefined"
      ? (loadFreeFireRecheck() ?? DEFAULT_RECHECK)
      : DEFAULT_RECHECK,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedPlan = loadFreeFirePlan();
    if (!storedPlan) {
      router.replace("/games/free-fire/improve");
      return;
    }

    void (async () => {
      try {
        const remote = await loadTrainingProgressFromSupabase(GAME_SLUG);
        const merged = mergeCompletedTasks(storedPlan.completedTasks, remote);
        const updated = unlockFreeFireNextDays({
          ...storedPlan,
          completedTasks: merged,
        });
        setPlan(updated);
        saveFreeFirePlan(updated);
      } catch {
        setPlan(unlockFreeFireNextDays(storedPlan));
      } finally {
        setHydrated(true);
      }
    })();
  }, [router]);

  const activeDayPlan = useMemo(
    () => plan?.days.find((day) => day.day === plan.activeDay),
    [plan],
  );

  const dayCompletion = plan ? getFreeFireDayCompletion(plan, plan.activeDay) : 0;
  const dayDone = plan ? isFreeFireDayComplete(plan, plan.activeDay) : false;

  const characterNames = useMemo(() => {
    if (!plan) return [];
    return plan.summary.characters
      .map(
        (id) => FREE_FIRE_CHARACTERS.find((character) => character.id === id)?.name ?? id,
      )
      .slice(0, 4);
  }, [plan]);

  const handleToggleTask = (taskId: string) => {
    if (!plan) return;
    const day = plan.activeDay;
    const task = plan.days
      .find((entry) => entry.day === day)
      ?.tasks.find((item) => item.id === taskId);
    const updated = toggleFreeFireTaskComplete(plan, day, taskId);
    setPlan(updated);
    saveFreeFirePlan(updated);

    const isCompleted = (updated.completedTasks[day] ?? []).includes(taskId);
    void upsertTrainingTaskProgress({
      gameSlug: GAME_SLUG,
      planDay: day,
      taskId,
      taskTitle: task?.title ?? taskId,
      isCompleted,
    });
  };

  const handleSelectDay = (day: number) => {
    if (!plan) return;
    const target = plan.days.find((entry) => entry.day === day);
    if (!target?.unlocked) return;
    const updated = { ...plan, activeDay: day };
    setPlan(updated);
    saveFreeFirePlan(updated);
  };

  const handleRecheckSave = () => {
    saveFreeFireRecheck(recheck);
  };

  if (!hydrated || !plan || !activeDayPlan) {
    return (
      <FreeFireImproveCard className="p-6 text-sm text-zinc-400">
        Loading your Free Fire training plan…
      </FreeFireImproveCard>
    );
  }

  return (
    <div className="space-y-6">
      <FreeFireImproveCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-orange-300/80">
              Your Free Fire training plan
            </p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Day {plan.activeDay} of 7 · {activeDayPlan.label}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {plan.source === "custom" ? (
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs text-indigo-100">
                  Custom plan
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                  Guided plan
                </span>
              )}
              {plan.summary.planName ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                  {plan.summary.planName}
                </span>
              ) : null}
              <FreeFireRankBadge rank={plan.summary.rank} />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                {plan.summary.role}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                {plan.summary.practiceTime}
              </span>
            </div>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Today&apos;s completion
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {dayCompletion}%
            </p>
            <div className="mt-3">
              <FreeFireProgressBar value={dayCompletion} />
            </div>
            {dayDone ? (
              <p className="mt-3 text-sm font-medium text-emerald-300">
                Day complete — nice work.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Characters" value={characterNames.join(", ") || "Not set"} />
          <SummaryTile label="Weaknesses" value={plan.summary.weaknesses.join(", ")} />
          <SummaryTile label="Goal" value={plan.summary.goal} />
          <SummaryTile
            label="Routine size"
            value={
              plan.summary.routineSize === "short"
                ? `Short · ${plan.summary.taskTarget} tasks`
                : plan.summary.routineSize === "medium"
                  ? `Medium · ${plan.summary.taskTarget} tasks`
                  : `Full · ${plan.summary.taskTarget} tasks`
            }
          />
        </div>
      </FreeFireImproveCard>

      <FreeFireImproveCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {plan.days.map((day) => (
            <button
              key={day.day}
              type="button"
              disabled={!day.unlocked}
              onClick={() => handleSelectDay(day.day)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                plan.activeDay === day.day
                  ? "border-orange-400/40 bg-orange-500/20 text-orange-50"
                  : day.unlocked
                    ? "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20"
                    : "cursor-not-allowed border-white/5 bg-black/20 text-zinc-600"
              }`}
            >
              Day {day.day}
              {!day.unlocked
                ? " · Locked"
                : isFreeFireDayComplete(plan, day.day)
                  ? " · Done"
                  : ""}
            </button>
          ))}
        </div>

        <FreeFireProgressBar
          value={dayCompletion}
          label={`Step ${plan.activeDay} of 7 · ${activeDayPlan.tasks.length} tasks today`}
        />

        <div className="mt-5 space-y-3">
          {activeDayPlan.tasks.map((task) => {
            const checked = (plan.completedTasks[plan.activeDay] ?? []).includes(task.id);
            return (
              <label
                key={task.id}
                className={`flex cursor-pointer gap-4 rounded-2xl border p-4 transition hover:border-white/20 ${
                  checked
                    ? "border-emerald-400/25 bg-emerald-400/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleTask(task.id)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-orange-500 focus:ring-orange-400/40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Module {task.module}
                    </span>
                    <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                      {task.duration}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{task.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{task.reason}</p>
                </div>
              </label>
            );
          })}
        </div>
      </FreeFireImproveCard>

      <FreeFireImproveCard className="p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-orange-300/75">
          Re-check progress
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">How did today go?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Quick reflection prompts. Saved locally for now — future versions can refresh your
          plan.
        </p>

        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={recheck.rankChanged}
              onChange={(event) =>
                setRecheck((current) => ({ ...current, rankChanged: event.target.checked }))
              }
              className="h-4 w-4 rounded border-white/20 bg-black/40 text-orange-500"
            />
            <span className="text-sm text-zinc-300">Did your rank change?</span>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              What improved today?
            </span>
            <textarea
              value={recheck.feltBetter}
              onChange={(event) =>
                setRecheck((current) => ({ ...current, feltBetter: event.target.value }))
              }
              rows={3}
              placeholder="Example: Gloo wall peeks felt cleaner in Clash Squad."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-400/40 focus:outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              What still feels weak?
            </span>
            <textarea
              value={recheck.stillWeak}
              onChange={(event) =>
                setRecheck((current) => ({ ...current, stillWeak: event.target.value }))
              }
              rows={3}
              placeholder="Example: Still panic spraying in 1v2 situations."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-400/40 focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRecheckSave}
              className="rounded-full border border-orange-400/35 bg-orange-500/15 px-5 py-2.5 text-sm font-medium text-orange-50 transition hover:bg-orange-500/25"
            >
              Save reflection
            </button>
            <button
              type="button"
              disabled
              title="Plan regeneration coming soon"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-500"
            >
              Update plan (coming soon)
            </button>
          </div>
        </div>
      </FreeFireImproveCard>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/games/free-fire/improve/custom"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Make your own plan
        </Link>
        <Link
          href="/games/free-fire/improve/questions"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Retake questionnaire
        </Link>
        <Link
          href="/games/free-fire/improve"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Back to improve home
        </Link>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-200">{value}</p>
    </div>
  );
}
