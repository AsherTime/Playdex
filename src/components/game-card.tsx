import Link from "next/link";
import type { GameWithTrend } from "@/types/gamedex";
import { GameCover } from "@/components/game-cover";

export function GameCard({ game }: { game: GameWithTrend }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block rounded-3xl border border-white/10 bg-white/[0.03] p-3 transition hover:-translate-y-1 hover:border-indigo-300/25 hover:bg-white/[0.05]"
    >
      <GameCover game={game} />
      <div className="space-y-2 p-2 pt-4">
        <h3 className="font-medium text-white group-hover:text-indigo-100">{game.title}</h3>
        <p className="text-sm text-zinc-400">{game.genre}</p>
        <p className="text-xs text-zinc-500">{game.platforms.join(" · ")}</p>
      </div>
    </Link>
  );
}
