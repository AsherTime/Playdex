import Link from "next/link";
import type { GameWithTrend } from "@/types/gamedex";
import { TrendBadge } from "@/components/trend-badge";

export function TrendingGamesPanel({ games }: { games: GameWithTrend[] }) {
  if (!games.length) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
            Pulse
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white">Trending games</h2>
          <p className="mt-1 text-xs text-zinc-500">Ranked by current platform heat.</p>
        </div>

        <div className="space-y-2 p-3">
          {games.map((game, index) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-black/20 px-3 py-2.5 transition hover:border-white/10 hover:bg-black/35"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold tabular-nums text-zinc-400 group-hover:text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{game.title}</p>
                  <p className="truncate text-xs text-zinc-500">{game.genre}</p>
                </div>
              </div>
              <TrendBadge status={game.trend.status} />
            </Link>
          ))}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <Link
            href="/games"
            className="text-xs font-medium text-indigo-200 transition hover:text-indigo-100"
          >
            Browse all games →
          </Link>
        </div>
      </div>
    </aside>
  );
}
