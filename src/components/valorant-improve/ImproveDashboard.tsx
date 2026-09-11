"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnalysisPanel } from "@/components/valorant-improve/coach/AnalysisPanel";
import { MatchReviewPanel } from "@/components/valorant-improve/coach/MatchReviewPanel";
import { OverviewPanel } from "@/components/valorant-improve/coach/OverviewPanel";
import { ProgressPanel } from "@/components/valorant-improve/coach/ProgressPanel";
import { TodayPlanPanel } from "@/components/valorant-improve/coach/TodayPlanPanel";
import { ImproveCard } from "@/components/valorant-improve/ImproveShell";
import { useValorantCoach } from "@/components/valorant-improve/useValorantCoach";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "Analysis" },
  { id: "plan", label: "Today's Plan" },
  { id: "matches", label: "Match Review" },
  { id: "progress", label: "Progress" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ImproveDashboard() {
  const searchParams = useSearchParams();
  const initial = TABS.some((tab) => tab.id === searchParams.get("tab"))
    ? (searchParams.get("tab") as TabId)
    : "overview";
  const [tab, setTab] = useState<TabId>(initial);
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const coach = useValorantCoach(range);

  if (!coach.hydrated || !coach.plan) {
    return <ImproveCard className="p-6 text-sm text-zinc-400">Loading your coach…</ImproveCard>;
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              tab === item.id
                ? "border-rose-400/40 bg-rose-500/15 text-rose-50"
                : "border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewPanel snapshot={coach.snapshot} plan={coach.plan} focus={coach.focus} />
      ) : null}
      {tab === "analysis" ? (
        <AnalysisPanel board={coach.snapshot.board} metrics={coach.snapshot.metrics} />
      ) : null}
      {tab === "plan" ? (
        <TodayPlanPanel
          plan={coach.plan}
          focus={coach.focus}
          onStart={coach.handleStart}
          onComplete={coach.handleToggleComplete}
          onSkip={coach.handleSkip}
        />
      ) : null}
      {tab === "matches" ? (
        <MatchReviewPanel
          matches={coach.snapshot.matches}
          riotConnected={coach.snapshot.riotConnected}
        />
      ) : null}
      {tab === "progress" ? (
        <ProgressPanel series={coach.snapshot.progress} range={range} onRange={setRange} />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/games/valorant/improve/questions"
          className="text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Update questionnaire
        </Link>
        <Link
          href="/games/valorant/improve/custom"
          className="text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Custom plan
        </Link>
      </div>
    </div>
  );
}
