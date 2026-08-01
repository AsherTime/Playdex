import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterHero } from "@/components/game-calc/CharacterHero";
import { CharacterTeamRankings } from "@/components/game-calc/CharacterTeamRankings";
import { getCharacter, getAllCalcCharacterParams } from "@/lib/characters";
import { isCalcGame } from "@/lib/team-games";

export function generateStaticParams() {
  return getAllCalcCharacterParams();
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ slug: string; characterSlug: string }>;
}) {
  const { slug, characterSlug } = await params;

  if (!isCalcGame(slug)) notFound();

  const character = getCharacter(slug, characterSlug);
  if (!character) notFound();

  return (
    <div className="space-y-6">
      <CharacterHero character={character} gameSlug={slug} />
      <CharacterTeamRankings
        gameId={slug}
        characterSlug={characterSlug}
        characterName={character.name}
      />
      <div className="flex justify-start">
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
