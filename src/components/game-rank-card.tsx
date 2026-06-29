import Link from "next/link";
import type { GameWithTrend } from "@/types/gamedex";
import { TrendBadge } from "@/components/trend-badge";
import { formatPercent } from "@/utils/formatters";

export function GameRankCard({ game, rank }: { game: GameWithTrend; rank: number }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-indigo-300/20 hover:bg-white/[0.05] sm:grid-cols-[auto_auto_1fr_auto]"
    >
      <span className="text-sm text-zinc-500">#{rank}</span>
      <span className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${game.coverTone}`} />
      <span>
        <span className="block font-medium text-white">{game.title}</span>
        <span className="block text-sm text-zinc-400">
          {game.genre} · {game.platforms.join(", ")}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className="text-right">
          <span className="block text-sm font-medium text-white">{game.trend.score}</span>
          <span className="block text-xs text-zinc-500">{formatPercent(game.latestMetric.playerGrowth)}</span>
        </span>
        <TrendBadge status={game.trend.status} />
      </span>
    </Link>
  );
}
