"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { buildImprovementSnapshotFromLocal } from "@/lib/improvement-snapshot";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return buildImprovementSnapshotFromLocal();
}

export function HomeTodayPlanCard() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (!snapshot) {
    return null;
  }

  const planHref =
    snapshot.gameSlug === "valorant"
      ? "/games/valorant/improve/plan"
      : "/games/free-fire/improve/plan";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
            Today&apos;s Plan
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{snapshot.gameName}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {snapshot.completedTasks} / {snapshot.totalTasks} tasks completed
          </p>
        </div>
        <Link
          href={planHref}
          className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-xs font-medium text-indigo-50"
        >
          Continue Plan →
        </Link>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-zinc-300">
        {snapshot.todayTasks.slice(0, 3).map((task) => (
          <li key={task} className="flex gap-2">
            <span className="text-zinc-600">•</span>
            <span>{task}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
