import Link from "next/link";
import { NewsCard } from "@/components/news-card";
import { SectionHeader } from "@/components/section-header";
import { getServerFollowedGameSlugs } from "@/lib/auth-server-helpers";
import { getLatestNews, getTrackedGames } from "@/lib/news";

type NewsPageProps = {
  searchParams: Promise<{ game?: string }>;
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { game } = await searchParams;
  const followedSlugs = game ? [] : await getServerFollowedGameSlugs();
  const [latestNews, trackedGames] = await Promise.all([
    getLatestNews(24, game, followedSlugs),
    getTrackedGames(),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Feed"
        title="Latest Gaming News"
        description={
          followedSlugs.length
            ? "Official updates with your followed games shown first."
            : "Official updates and announcements from tracked games and sources."
        }
      />
      <div className="flex flex-wrap gap-2">
        <Link
          href="/news"
          className={`rounded-full border px-3 py-1 text-sm transition ${game ? "border-white/10 text-white/70 hover:border-white/20" : "border-white/30 bg-white/10 text-white"}`}
        >
          All games
        </Link>
        {trackedGames.map((trackedGame) => (
          <Link
            key={trackedGame.id}
            href={`/news?game=${trackedGame.slug}`}
            className={`rounded-full border px-3 py-1 text-sm transition ${game === trackedGame.slug || game === trackedGame.id ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/70 hover:border-white/20"}`}
          >
            {trackedGame.title}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {latestNews.length ? (
          latestNews.map((item) => <NewsCard key={item.id} item={item} />)
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-zinc-400">
            No tracked updates with thumbnails yet. Run the news collector from{" "}
            <Link href="/admin" className="text-indigo-300 hover:text-indigo-200">
              /admin
            </Link>{" "}
            or check back after the next scheduled sync.
          </p>
        )}
      </div>
    </div>
  );
}
