import Link from "next/link";
import type { MockTeamRankRow } from "@/data/mock-character-teams";
import type { CharacterSummary } from "@/types/teams";
import { TeamMemberIcons } from "@/components/game-calc/TeamMemberIcons";

const RANK_STYLES: Record<number, string> = {
  1: "from-amber-400/20 to-amber-600/5 text-amber-200 border-amber-400/25",
  2: "from-zinc-300/15 to-zinc-500/5 text-zinc-200 border-white/15",
  3: "from-orange-700/20 to-orange-900/5 text-orange-200 border-orange-600/20",
};

function RankBadge({ rank }: { rank: number }) {
  const style =
    RANK_STYLES[rank] ??
    "from-indigo-500/15 to-indigo-700/5 text-indigo-200 border-indigo-400/20";

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-sm font-bold tabular-nums sm:h-10 sm:w-10 ${style}`}
    >
      {rank}
    </div>
  );
}

function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className}>
      <path
        d="M7.5 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TeamRankCard({
  row,
  members,
  primaryMetricLabel,
  breakdownHref,
  isActive = false,
}: {
  row: MockTeamRankRow;
  members: CharacterSummary[];
  primaryMetricLabel: string;
  breakdownHref?: string;
  isActive?: boolean;
}) {
  const actionClassName =
    "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:px-4 sm:text-sm";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white/[0.03] transition duration-200 hover:border-white/20 hover:bg-white/[0.05] ${
        isActive ? "border-indigo-400/35 bg-indigo-400/[0.06]" : "border-white/10"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/[0.04] to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <RankBadge rank={row.rank} />
          <TeamMemberIcons members={members} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white sm:text-base">{row.teamName}</h3>
            <p className="mt-0.5 text-xs text-zinc-500 sm:hidden">
              {primaryMetricLabel} · {row.primaryMetric}
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-6 sm:flex lg:gap-8">
          <div className="min-w-[4.5rem] text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              {primaryMetricLabel}
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{row.primaryMetric}</p>
          </div>
          <div className="min-w-[3.5rem] text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Rotation
            </p>
            <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">{row.rotation}</p>
          </div>
          <div className="min-w-[4.5rem] text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Total DMG
            </p>
            <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">{row.totalDamage}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
          <div className="flex gap-5 sm:hidden">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Rotation
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">{row.rotation}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                Total DMG
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">{row.totalDamage}</p>
            </div>
          </div>

          {breakdownHref ? (
            <Link
              href={breakdownHref}
              className={`${actionClassName} border-white/10 bg-white/[0.04] text-zinc-300 group-hover:border-indigo-400/30 group-hover:bg-indigo-400/10 group-hover:text-indigo-100 ${
                isActive ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-100" : ""
              }`}
            >
              <span className="hidden sm:inline">{isActive ? "Viewing breakdown" : "View breakdown"}</span>
              <span className="sm:hidden">{isActive ? "Viewing" : "Breakdown"}</span>
              <ChevronRightIcon className="h-4 w-4 opacity-70" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={`${actionClassName} border-white/10 bg-white/[0.04] text-zinc-500`}
            >
              <span className="hidden sm:inline">View breakdown</span>
              <span className="sm:hidden">Breakdown</span>
              <ChevronRightIcon className="h-4 w-4 opacity-70" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
