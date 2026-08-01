"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FREE_FIRE_TASK_CATALOG } from "@/data/free-fire-task-catalog";
import { buildFreeFireCustomPlan } from "@/lib/free-fire-custom-plan";
import {
  saveFreeFirePlan,
  saveFreeFireQuestionnaire,
} from "@/lib/free-fire-improve-storage";
import {
  FreeFireImproveCard,
} from "@/components/free-fire-improve/FreeFireImproveShell";
import { FreeFireRankBadge } from "@/components/free-fire-improve/FreeFireRankBadge";
import type {
  FreeFirePracticeTime,
  FreeFireQuestionnaire,
  FreeFireRank,
  FreeFireRole,
  FreeFireTaskModule,
} from "@/types/free-fire-improve";
import {
  FREE_FIRE_GOALS,
  FREE_FIRE_PRACTICE_TIMES,
  FREE_FIRE_RANKS,
  FREE_FIRE_ROLES,
} from "@/types/free-fire-improve";

type CustomTaskDraft = { title: string; duration: string; reason: string };

function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${
        selected
          ? "border-orange-400/40 bg-orange-500/20 text-orange-50"
          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      {label}
    </button>
  );
}

export function FreeFireCustomPlanBuilder() {
  const router = useRouter();
  const [planName, setPlanName] = useState("My custom Free Fire plan");
  const [rank, setRank] = useState<FreeFireRank>("Gold");
  const [role, setRole] = useState<FreeFireRole>("Rusher");
  const [goal, setGoal] = useState("Reach the next rank");
  const [practiceTime, setPracticeTime] = useState<FreeFirePracticeTime>("30 minutes");
  const [selectedModules, setSelectedModules] = useState<FreeFireTaskModule[]>([
    "A",
    "D",
    "G",
  ]);
  const [customTasks, setCustomTasks] = useState<CustomTaskDraft[]>([
    { title: "", duration: "15 min", reason: "" },
  ]);

  const selectedTemplates = useMemo(
    () => FREE_FIRE_TASK_CATALOG.filter((task) => selectedModules.includes(task.module)),
    [selectedModules],
  );

  const taskCount =
    selectedTemplates.length + customTasks.filter((task) => task.title.trim()).length;

  const toggleModule = (module: FreeFireTaskModule) => {
    setSelectedModules((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module],
    );
  };

  const handleSave = () => {
    if (taskCount === 0) return;

    const plan = buildFreeFireCustomPlan({
      planName,
      rank,
      role,
      goal,
      practiceTime,
      selectedModules: selectedTemplates,
      customTasks: customTasks.filter((task) => task.title.trim()),
    });

    const stubQuestionnaire: FreeFireQuestionnaire = {
      rank,
      role,
      characters: [],
      weaknesses: [],
      bestWeaponType: "Assault Rifle",
      lostRoundCause: "Don't know",
      matchesPerDay: "2",
      practiceTime,
      practiceMethod: "None",
      sensitivity: {
        general: 100,
        redDot: 90,
        scope2x: 85,
        scope4x: 80,
        sniperScope: 70,
        freeLook: 100,
      },
      goal,
      consistency: "Most days",
    };

    saveFreeFireQuestionnaire(stubQuestionnaire);
    saveFreeFirePlan(plan);
    router.push("/games/free-fire/improve/plan");
  };

  return (
    <div className="space-y-5">
      <FreeFireImproveCard className="p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-orange-300/75">
          Make your own plan
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Build your daily Free Fire routine
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Skip the questionnaire and choose aim, gloo, movement, and ranked modules yourself.
          Your routine repeats across a 7-day tracker.
        </p>
      </FreeFireImproveCard>

      <FreeFireImproveCard className="space-y-5 p-5 sm:p-6">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Plan name
          </span>
          <input
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-orange-400/40 focus:outline-none"
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Rank</p>
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_RANKS.map((item) => (
              <FreeFireRankBadge
                key={item}
                rank={item}
                selected={rank === item}
                onClick={() => setRank(item)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Role</p>
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_ROLES.map((item) => (
              <OptionChip
                key={item}
                label={item}
                selected={role === item}
                onClick={() => setRole(item)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Daily practice time
          </p>
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_PRACTICE_TIMES.map((item) => (
              <OptionChip
                key={item}
                label={item}
                selected={practiceTime === item}
                onClick={() => setPracticeTime(item)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Goal</p>
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_GOALS.map((item) => (
              <OptionChip
                key={item}
                label={item}
                selected={goal === item}
                onClick={() => setGoal(item)}
              />
            ))}
          </div>
        </div>
      </FreeFireImproveCard>

      <FreeFireImproveCard className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Training modules</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Select the drills for your daily checklist. {taskCount} task
            {taskCount === 1 ? "" : "s"} selected.
          </p>
        </div>

        <div className="space-y-3">
          {FREE_FIRE_TASK_CATALOG.map((task) => {
            const selected = selectedModules.includes(task.module);
            return (
              <button
                key={task.module}
                type="button"
                onClick={() => toggleModule(task.module)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-orange-400/35 bg-orange-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Module {task.module}
                  </span>
                  <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                    {task.duration}
                  </span>
                  {selected ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-orange-200">
                      Added
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{task.reason}</p>
              </button>
            );
          })}
        </div>
      </FreeFireImproveCard>

      <FreeFireImproveCard className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Custom tasks</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Add your own drills (optional). Empty rows are ignored.
          </p>
        </div>

        {customTasks.map((task, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1.2fr_0.6fr]"
          >
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Task title</span>
              <input
                value={task.title}
                onChange={(event) =>
                  setCustomTasks((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, title: event.target.value }
                        : entry,
                    ),
                  )
                }
                placeholder="Example: Bermuda warehouse gloo peeks"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-400/40 focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Duration</span>
              <input
                value={task.duration}
                onChange={(event) =>
                  setCustomTasks((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, duration: event.target.value }
                        : entry,
                    ),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-orange-400/40 focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-zinc-500">Why it helps</span>
              <input
                value={task.reason}
                onChange={(event) =>
                  setCustomTasks((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, reason: event.target.value }
                        : entry,
                    ),
                  )
                }
                placeholder="Optional note"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-400/40 focus:outline-none"
              />
            </label>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setCustomTasks((current) => [
              ...current,
              { title: "", duration: "15 min", reason: "" },
            ])
          }
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
        >
          Add another custom task
        </button>
      </FreeFireImproveCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Daily checklist will include <span className="text-white">{taskCount}</span> task
          {taskCount === 1 ? "" : "s"} for 7 days.
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={taskCount === 0}
          className="rounded-full border border-orange-400/35 bg-orange-500/15 px-5 py-2.5 text-sm font-medium text-orange-50 transition hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save & open plan
        </button>
      </div>
    </div>
  );
}
