import { notFound } from "next/navigation";
import { GameProfileHeader } from "@/components/game-calc/GameProfileHeader";
import { CharacterSection } from "@/components/game-calc/CharacterSection";
import { getCharactersForGame } from "@/lib/characters";
import { getGameDetail } from "@/lib/games";
import { getLatestNewsForGame } from "@/lib/news";
import type { CalcGameId } from "@/types/teams";

export async function GameCalcHubPage({ slug }: { slug: CalcGameId }) {
  const game = await getGameDetail(slug);
  if (!game) notFound();

  const latestNews = await getLatestNewsForGame(slug, 12);

  return (
    <div className="space-y-6">
      <GameProfileHeader game={game} latestNews={latestNews} />
      <CharacterSection characters={getCharactersForGame(slug)} gameSlug={slug} />
    </div>
  );
}
