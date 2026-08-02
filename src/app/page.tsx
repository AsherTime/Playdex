import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { ImproveQuickStartCard } from "@/components/improve-quick-start-card";
import { NewsCard } from "@/components/news-card";
import { NewsTrackerStrip } from "@/components/news-tracker-strip";
import { TrendingGamesPanel } from "@/components/trending-games-panel";
import { getServerFollowedGameSlugs } from "@/lib/auth-server-helpers";
import { getTrendingGames } from "@/lib/games";
import { getLatestNews } from "@/lib/news";

export default async function HomePage() {
  const followedSlugs = await getServerFollowedGameSlugs();
  const [feedNews, trendingGames] = await Promise.all([
    getLatestNews(24, undefined, followedSlugs),
    Promise.resolve(getTrendingGames().slice(0, 5)),
  ]);

  const trackerNews = feedNews.slice(0, 12);

  return (
    <div className="space-y-6">
      <HomeHero followedCount={followedSlugs.length} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <NewsTrackerStrip items={trackerNews} />
          <ImproveQuickStartCard />

          {feedNews.length ? (
            <section className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
                  Updates feed
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Latest news & patches
                </h2>
                <p className="text-sm text-zinc-400">
                  Only tracked articles with thumbnails are shown here. Browse the full feed on{" "}
                  <Link href="/news" className="text-indigo-300 hover:text-indigo-200">
                    /news
                  </Link>
                  .
                  {followedSlugs.length ? (
                    <> Your followed games are prioritized.</>
                  ) : null}
                </p>
              </div>

              <div className="space-y-3">
                {feedNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <TrendingGamesPanel games={trendingGames} />
      </div>
    </div>
  );
}
