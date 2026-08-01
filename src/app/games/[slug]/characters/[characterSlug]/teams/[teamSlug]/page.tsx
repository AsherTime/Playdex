import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterHero } from "@/components/game-calc/CharacterHero";
import { CharacterTeamRankings } from "@/components/game-calc/CharacterTeamRankings";
import { TeamBreakdownChart } from "@/components/game-calc/TeamBreakdownChart";
import { getCharacter } from "@/lib/characters";
import { getAllMockTeamParams, getMockTeamBreakdown } from "@/data/mock-character-teams";
import { isCalcGame } from "@/lib/team-games";

export function generateStaticParams() {
  return getAllMockTeamParams();
}

export default async function TeamBreakdownPage({
  params,
}: {
  params: Promise<{ slug: string; characterSlug: string; teamSlug: string }>;
}) {
  const { slug, characterSlug, teamSlug } = await params;

  if (!isCalcGame(slug)) notFound();

  const character = getCharacter(slug, characterSlug);
  if (!character) notFound();

  const breakdown = getMockTeamBreakdown(slug, teamSlug);
  if (!breakdown) notFound();

  return (
    <div className="space-y-6">
      <CharacterHero
        character={character}
        gameSlug={slug}
        teamBreadcrumb="Team breakdown"
      />
      <TeamBreakdownChart breakdown={breakdown} gameId={slug} />
      <CharacterTeamRankings
        gameId={slug}
        characterSlug={characterSlug}
        characterName={character.name}
        activeTeamSlug={teamSlug}
        title="More teams with"
        description="Explore other ranked team setups for this character."
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/games/${slug}/characters/${characterSlug}`}
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Back to {character.name}
        </Link>
        <Link
          href={`/games/${slug}#characters`}
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Back to character roster
        </Link>
      </div>
    </div>
  );
}
