import { GameCard } from "@/components/game-card";
import { SectionHeader } from "@/components/section-header";
import { getAllGames } from "@/lib/games";

export default function GamesPage() {
  const games = getAllGames();

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Library"
        title="Games"
        description="Tracked titles with live news and official update sources."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
