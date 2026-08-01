import Link from "next/link";
import { EditorialPostCard } from "@/components/editorial-post-card";
import { HomeHero } from "@/components/home-hero";
import { ImproveQuickStartCard } from "@/components/improve-quick-start-card";
import { NewsTrackerStrip } from "@/components/news-tracker-strip";
import { TrendingGamesPanel } from "@/components/trending-games-panel";
import { getServerFollowedGameSlugs } from "@/lib/auth-server-helpers";
import { getEditorialPosts } from "@/lib/editorial-posts";
import { getTrendingGames } from "@/lib/games";
import { getLatestNews } from "@/lib/news";

export default async function HomePage() {
  const followedSlugs = await getServerFollowedGameSlugs();
  const [trackerNews, editorialPosts, trendingGames] = await Promise.all([
    getLatestNews(16, undefined, followedSlugs),
    Promise.resolve(getEditorialPosts()),
    Promise.resolve(getTrendingGames().slice(0, 5)),
  ]);

  return (
    <div className="space-y-6">
      <HomeHero followedCount={followedSlugs.length} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <NewsTrackerStrip items={trackerNews} />
          <ImproveQuickStartCard />

          <section className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
                Editorial feed
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Community & guides
              </h2>
              <p className="text-sm text-zinc-400">
                Internal editorial placeholders for future posts. API-collected news lives in the
                tracker above and on{" "}
                <Link href="/news" className="text-indigo-300 hover:text-indigo-200">
                  /news
                </Link>
                .
                {followedSlugs.length ? (
                  <> Followed games are prioritized in your tracker.</>
                ) : null}
              </p>
            </div>

            <div className="space-y-4">
              {editorialPosts.map((post) => (
                <EditorialPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        </div>

        <TrendingGamesPanel games={trendingGames} />
      </div>
    </div>
  );
}
