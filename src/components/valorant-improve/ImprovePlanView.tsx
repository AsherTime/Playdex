"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VALORANT_AGENTS } from "@/data/valorant-agents";
import {
  getDayCompletion,
  isDayComplete,
  toggleTaskComplete,
  unlockNextDays,
} from "@/lib/valorant-improve-plan";
import {
  loadPlan,
  loadRecheck,
  savePlan,
  saveRecheck,
} from "@/lib/valorant-improve-storage";
import {
  loadTrainingProgressFromSupabase,
  mergeCompletedTasks,
  upsertTrainingTaskProgress,
} from "@/lib/training-progress";
import { ImproveCard, ProgressBar } from "@/components/valorant-improve/ImproveShell";
import { RankBadge } from "@/components/valorant-improve/RankBadge";
import type { ImprovementPlan, RecheckDraft } from "@/types/valorant-improve";

const DEFAULT_RECHECK: RecheckDraft = {
  rankChanged: false,
  feltBetter: "",
  stillWeak: "",
};
const GAME_SLUG = "valorant";

export function ImprovePlanView() {
  const router = useRouter();
  const [plan, setPlan] = useState<ImprovementPlan | null>(null);
  const [recheck, setRecheck] = useState<RecheckDraft>(() =>
    typeof window !== "undefined" ? (loadRecheck() ?? DEFAULT_RECHECK) : DEFAULT_RECHECK,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedPlan = loadPlan();
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
        setHydrated(true);
      }
    })();
  }, [router]);

  const activeDayPlan = useMemo(
    () => plan?.days.find((day) => day.day === plan.activeDay),
    [plan],
  );

  const dayCompletion = plan ? getDayCompletion(plan, plan.activeDay) : 0;
  const dayDone = plan ? isDayComplete(plan, plan.activeDay) : false;

  const agentNames = useMemo(() => {
    if (!plan) return [];
    return plan.summary.agents
      .map((id) => VALORANT_AGENTS.find((agent) => agent.id === id)?.name ?? id)
      .slice(0, 4);
  }, [plan]);

  const handleToggleTask = (taskId: string) => {
    if (!plan) return;
    const day = plan.activeDay;
    const task = plan.days.find((entry) => entry.day === day)?.tasks.find((item) => item.id === taskId);
    const updated = toggleTaskComplete(plan, day, taskId);
    setPlan(updated);
    savePlan(updated);

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
    savePlan(updated);
  };

  const handleRecheckSave = () => {
    saveRecheck(recheck);
  };

  if (!hydrated || !plan || !activeDayPlan) {
    return (
      <ImproveCard className="p-6 text-sm text-zinc-400">
        Loading your improvement plan…
      </ImproveCard>
    );
  }

  return (
    <div className="space-y-6">
      <ImproveCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-rose-300/80">
              Your improvement plan
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
              <RankBadge rank={plan.summary.rank} />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                {plan.summary.role}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                {plan.summary.practiceTime}
              </span>
            </div>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Today&apos;s completion</p>
            <p className="mt-1 text-2xl font-semibold text-white tabular-nums">{dayCompletion}%</p>
            <div className="mt-3">
              <ProgressBar value={dayCompletion} />
            </div>
            {dayDone ? (
              <p className="mt-3 text-sm font-medium text-emerald-300">Day complete — nice work.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Agents" value={agentNames.join(", ") || "Not set"} />
          <SummaryTile label="Weaknesses" value={plan.summary.weaknesses.join(", ")} />
          <SummaryTile label="Goal" value={plan.summary.goal} />
          <SummaryTile
            label="Routine size"
            value={
              plan.summary.routineSize === "short"
                ? "Short"
                : plan.summary.routineSize === "medium"
                  ? "Medium"
                  : "Full"
            }
          />
        </div>
      </ImproveCard>

      <ImproveCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {plan.days.map((day) => (
            <button
              key={day.day}
              type="button"
              disabled={!day.unlocked}
              onClick={() => handleSelectDay(day.day)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                plan.activeDay === day.day
                  ? "border-rose-400/40 bg-rose-500/20 text-rose-50"
                  : day.unlocked
                    ? "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20"
                    : "cursor-not-allowed border-white/5 bg-black/20 text-zinc-600"
              }`}
            >
              Day {day.day}
              {!day.unlocked ? " · Locked" : isDayComplete(plan, day.day) ? " · Done" : ""}
            </button>
          ))}
        </div>

        <ProgressBar
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
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-rose-500 focus:ring-rose-400/40"
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
      </ImproveCard>

      <ImproveCard className="p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose-300/75">
          Re-check progress
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">How did today go?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Quick reflection prompts. Saved locally for now — future versions can refresh your plan.
        </p>

        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={recheck.rankChanged}
              onChange={(event) =>
                setRecheck((current) => ({ ...current, rankChanged: event.target.checked }))
              }
              className="h-4 w-4 rounded border-white/20 bg-black/40 text-rose-500"
            />
            <span className="text-sm text-zinc-300">Did your rank change?</span>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              What felt better today?
            </span>
            <textarea
              value={recheck.feltBetter}
              onChange={(event) =>
                setRecheck((current) => ({ ...current, feltBetter: event.target.value }))
              }
              rows={3}
              placeholder="Example: Crosshair placement on Ascent A main felt cleaner."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-rose-400/40 focus:outline-none"
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
              placeholder="Example: Still panic swinging in 1v2 situations."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-rose-400/40 focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRecheckSave}
              className="rounded-full border border-rose-400/35 bg-rose-500/15 px-5 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-500/25"
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
      </ImproveCard>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/games/valorant/improve/custom"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Make your own plan
        </Link>
        <Link
          href="/games/valorant/improve/questions"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Retake questionnaire
        </Link>
        <Link
          href="/games/valorant/improve"
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
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200">{value}</p>
    </div>
  );
}
