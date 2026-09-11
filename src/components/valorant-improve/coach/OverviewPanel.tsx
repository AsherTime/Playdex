import { ImproveCard, ProgressBar } from "@/components/valorant-improve/ImproveShell";
import { RankBadge } from "@/components/valorant-improve/RankBadge";
import { getDayCompletion } from "@/lib/valorant-improve-plan";
import type { CoachSnapshot } from "@/lib/valorant-coach";
import type { ImprovementPlan, ValorantRank } from "@/types/valorant-improve";

export function OverviewPanel({
  snapshot,
  plan,
  focus,
}: {
  snapshot: CoachSnapshot;
  plan: ImprovementPlan;
  focus: string;
}) {
  const completion = getDayCompletion(plan, plan.activeDay);
  const rank = snapshot.metrics.rank;

  return (
    <div className="space-y-4">
      <ImproveCard className="p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose-300/80">
          Overview
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Today&apos;s coaching snapshot</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Rank and agents come from your questionnaire. Combat numbers are labeled sample data
          until Riot is connected.
        </p>
      </ImproveCard>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ImproveCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Current rank</p>
          <div className="mt-3">
            {rank ? <RankBadge rank={rank as ValorantRank} /> : <p className="text-sm text-zinc-300">Not set</p>}
          </div>
          <p className="mt-2 text-xs text-zinc-600">Self-reported · not from Riot</p>
        </ImproveCard>
        <ImproveCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Recent form</p>
          <p className="mt-2 text-xl font-semibold text-white">{snapshot.metrics.recentForm}</p>
          <p className="mt-2 text-xs text-amber-200/80">Sample last-5, not your matches</p>
        </ImproveCard>
        <ImproveCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Main agents</p>
          <p className="mt-2 text-sm text-white">
            {snapshot.metrics.mainAgents.join(", ") || "Not set"}
          </p>
          <p className="mt-2 text-xs text-zinc-600">{snapshot.metrics.role}</p>
        </ImproveCard>
        <ImproveCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Today&apos;s training</p>
          <p className="mt-2 text-xl font-semibold text-white tabular-nums">{completion}%</p>
          <div className="mt-3">
            <ProgressBar value={completion} />
          </div>
        </ImproveCard>
        <ImproveCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Biggest leak</p>
          <p className="mt-2 text-sm font-medium text-rose-100">{snapshot.metrics.biggestWeakness}</p>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{focus}</p>
        </ImproveCard>
        <ImproveCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Strongest area</p>
          <p className="mt-2 text-sm font-medium text-emerald-100">{snapshot.metrics.strongestArea}</p>
          <p className="mt-2 text-xs text-zinc-500">From your answers, not live stats</p>
        </ImproveCard>
      </div>
    </div>
  );
}
