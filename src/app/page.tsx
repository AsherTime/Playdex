import { DashboardLayout } from "@/components/dashboard-layout";
import { FeaturedCard } from "@/components/featured-card";
import { PostCard } from "@/components/post-card";
import { RightSidebar } from "@/components/right-sidebar";
import { SectionHeader } from "@/components/section-header";
import { TopSearch } from "@/components/top-search";
import {
  getFeaturedPosts,
  getFeedPosts,
  getTopStreamers,
  getTopYouTubers,
  getUpcomingEsportsEvents,
} from "@/lib/content";
import { getTrendingGames } from "@/lib/games";

export default async function HomePage() {
  const [featuredPosts, feedPosts] = await Promise.all([getFeaturedPosts(), getFeedPosts()]);

  return (
    <DashboardLayout
      rightSidebar={
        <RightSidebar
          streamers={getTopStreamers()}
          creators={getTopYouTubers()}
          popularGames={getTrendingGames()}
          esportsEvents={getUpcomingEsportsEvents()}
        />
      }
    >
      <div className="space-y-6">
        <TopSearch />

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Featured"
            title="What moved the market"
            description="Curated signals across updates, patches, releases, and announcements."
          />
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {featuredPosts.map((post) => (
              <FeaturedCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Live feed"
            title="Gaming intelligence feed"
            description="News, updates, esports, community takes, and patch notes across the games that matter now."
          />
          <div className="space-y-4">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
