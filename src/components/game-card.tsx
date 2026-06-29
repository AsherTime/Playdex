import Link from "next/link";
import type { GameWithTrend } from "@/types/gamedex";
import { formatPercent } from "@/utils/formatters";
import { GameCover } from "@/components/game-cover";
import { TrendBadge } from "@/components/trend-badge";

export function GameCard({ game }: { game: GameWithTrend }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block rounded-3xl border border-white/10 bg-white/[0.03] p-3 transition hover:-translate-y-1 hover:border-indigo-300/25 hover:bg-white/[0.05]"
    >
      <GameCover game={game} />
      <div className="space-y-3 p-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-white group-hover:text-indigo-100">{game.title}</h3>
            <p className="text-sm text-zinc-400">{game.genre}</p>
          </div>
          <TrendBadge status={game.trend.status} />
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Trend {game.trend.score}</span>
          <span>{formatPercent(game.latestMetric.playerGrowth)}</span>
        </div>
      </div>
    </Link>
  );
}
