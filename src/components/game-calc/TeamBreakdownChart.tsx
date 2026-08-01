import type { MockTeamBreakdown } from "@/data/mock-character-teams";
import { getPrimaryMetricLabel } from "@/data/mock-character-teams";
import type { CalcGameId } from "@/types/teams";
import { TeamBreakdownBar } from "@/components/game-calc/TeamBreakdownBar";
import { TeamMemberIcons } from "@/components/game-calc/TeamMemberIcons";
import { getCharactersForGame } from "@/lib/characters";
import type { CharacterSummary } from "@/types/teams";

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 text-center first:pl-0 last:pr-0 sm:px-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white sm:text-xl">{value}</p>
    </div>
  );
}

function resolveMembers(memberSlugs: string[], roster: CharacterSummary[], gameId: CalcGameId) {
  return memberSlugs.map((slug, index) => {
    const found = roster.find((entry) => entry.slug === slug);
    if (found) return found;

    return {
      id: `placeholder-${slug}-${index}`,
      slug,
      gameId,
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      element: "Fusion",
      role: "Support",
      summary: "",
      portraitPath: "",
    };
  });
}

export function TeamBreakdownChart({
  breakdown,
  gameId,
}: {
  breakdown: MockTeamBreakdown;
  gameId: CalcGameId;
}) {
  const primaryMetricLabel = getPrimaryMetricLabel(gameId);
  const maxShare = Math.max(...breakdown.sources.map((source) => source.share), 1);
  const roster = getCharactersForGame(gameId);
  const members = resolveMembers(breakdown.memberSlugs, roster, gameId);
  const barGap = breakdown.sources.length >= 4 ? "gap-3 sm:gap-5" : "gap-2 sm:gap-4";

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
              Team breakdown
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <TeamMemberIcons members={members} />
              <h2 className="text-lg font-semibold text-white sm:text-xl">{breakdown.teamName}</h2>
            </div>
          </div>

          <div className="inline-flex divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20">
            <StatBlock label={primaryMetricLabel} value={breakdown.primaryMetric} />
            <StatBlock label="Total DMG" value={breakdown.totalDamage} />
            <StatBlock label="Rotation" value={breakdown.rotation} />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden px-3 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-6 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            Damage distribution
          </p>
          <div className={`flex items-end justify-center ${barGap}`}>
            {breakdown.sources.map((source) => (
              <TeamBreakdownBar
                key={source.id}
                source={source}
                maxShare={maxShare}
                gameId={gameId}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
