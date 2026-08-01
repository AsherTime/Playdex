import Link from "next/link";
import type { GameNews } from "@/types/gamedex";
import type { GameWithTrend } from "@/types/gamedex";
import { NewsTrackerStrip } from "@/components/news-tracker-strip";
import { GameTrendPlaceholder } from "@/components/game-calc/GameTrendPlaceholder";
import { getGameNewsFallback } from "@/lib/news-images";
import { formatDate } from "@/utils/formatters";

export function GameProfileHeader({
  game,
  latestNews,
}: {
  game: GameWithTrend;
  latestNews: GameNews[];
}) {
  const bannerSrc = getGameNewsFallback(game.id);

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className={`relative h-32 bg-gradient-to-br sm:h-40 ${game.coverTone}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#070811] to-transparent" />
        </div>

        <div className="relative px-4 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#070811] bg-zinc-900 shadow-lg sm:h-24 sm:w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerSrc} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs text-zinc-500">Released {formatDate(game.releaseDate)}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{game.title}</h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-400">{game.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">{game.genre}</span>
                {game.platforms.map((platform) => (
                  <span key={platform} className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="#characters"
              className="shrink-0 self-start rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-400/20 sm:self-auto"
            >
              Browse characters
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <NewsTrackerStrip items={latestNews} viewAllHref={`/news?game=${game.slug}`} />
        <GameTrendPlaceholder />
      </div>
    </section>
  );
}
