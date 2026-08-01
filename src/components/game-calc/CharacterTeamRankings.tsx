import {
  getMockTeamBreakdown,
  getMockTeamRankings,
  getPrimaryMetricLabel,
  getTeamBreakdownHref,
} from "@/data/mock-character-teams";
import { getCharactersForGame } from "@/lib/characters";
import type { CalcGameId, CharacterSummary } from "@/types/teams";
import { TeamRankCard } from "@/components/game-calc/TeamRankCard";

function resolveTeamMembers(
  memberSlugs: string[],
  roster: CharacterSummary[],
  gameId: CalcGameId,
): CharacterSummary[] {
  return memberSlugs.map((slug, index) => {
    const found = roster.find((c) => c.slug === slug);
    if (found) return found;

    return {
      id: `placeholder-${slug}-${index}`,
      slug,
      gameId,
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      element: "Pyro",
      role: "Support",
      summary: "",
      portraitPath: "",
    };
  });
}

export function CharacterTeamRankings({
  gameId,
  characterSlug,
  characterName,
  activeTeamSlug,
  title = "Top teams with",
  description = "Ranked team results for this character. Placeholder data — real calculations coming soon.",
}: {
  gameId: CalcGameId;
  characterSlug: string;
  characterName: string;
  activeTeamSlug?: string;
  title?: string;
  description?: string;
}) {
  const rows = getMockTeamRankings(gameId, characterSlug);
  const roster = getCharactersForGame(gameId);
  const primaryMetricLabel = getPrimaryMetricLabel(gameId);

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
          Team calculations
        </p>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          {title} {characterName}
        </h2>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>

      <div
        className="hidden rounded-xl border border-white/5 bg-black/20 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:grid sm:grid-cols-[2.5rem_1fr_auto_auto] sm:items-center sm:gap-4 lg:gap-5"
        aria-hidden
      >
        <span>Rank</span>
        <span className="pl-14">Team</span>
        <span className="flex justify-end gap-6 lg:gap-8">
          <span className="min-w-[4.5rem] text-right">{primaryMetricLabel}</span>
          <span className="min-w-[3.5rem] text-right">Rotation</span>
          <span className="min-w-[4.5rem] text-right">Total DMG</span>
        </span>
        <span className="w-[8.5rem] text-right"> </span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const hasBreakdown = Boolean(getMockTeamBreakdown(gameId, row.teamSlug));

          return (
            <TeamRankCard
              key={row.teamSlug}
              row={row}
              members={resolveTeamMembers(row.memberSlugs, roster, gameId)}
              primaryMetricLabel={primaryMetricLabel}
              breakdownHref={
                hasBreakdown
                  ? getTeamBreakdownHref(gameId, characterSlug, row.teamSlug)
                  : undefined
              }
              isActive={activeTeamSlug === row.teamSlug}
            />
          );
        })}
      </div>
    </section>
  );
}
