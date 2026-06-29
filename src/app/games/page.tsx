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
        description="A clean index of tracked titles, ready for richer filters once real data arrives."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
