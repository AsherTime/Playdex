import { GamingDashboard } from "@/components/home/GamingDashboard";
import { HomeNewsExplorer } from "@/components/home/HomeNewsExplorer";
import { HomeTodayPlanCard } from "@/components/home/HomeTodayPlanCard";
import { ImproveQuickStartCard } from "@/components/improve-quick-start-card";
import { TrendingGamesPanel } from "@/components/trending-games-panel";
import {
  getServerFollowedGameSlugs,
  getServerProfile,
  getServerUser,
} from "@/lib/auth-server-helpers";
import { getServerGamingDashboardStats } from "@/lib/gaming-stats";
import { getTrendingGames } from "@/lib/games";
import { getLatestNews } from "@/lib/news";

export default async function HomePage() {
  const [followedSlugs, user, profile] = await Promise.all([
    getServerFollowedGameSlugs(),
    getServerUser(),
    getServerProfile(),
  ]);

  const syncedStats = user ? await getServerGamingDashboardStats(user.id) : null;

  const [feedNews, trendingGames] = await Promise.all([
    getLatestNews(24, undefined, followedSlugs, "homepage"),
    Promise.resolve(getTrendingGames().slice(0, 5)),
  ]);

  return (
    <div className="space-y-6">
      <GamingDashboard
        profile={profile}
        syncedStats={syncedStats}
        userId={user?.id ?? null}
        isLoggedIn={Boolean(user)}
      />

      {user ? <HomeTodayPlanCard /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <HomeNewsExplorer items={feedNews}>
            <ImproveQuickStartCard />
          </HomeNewsExplorer>
        </div>

        <TrendingGamesPanel games={trendingGames} />
      </div>
    </div>
  );
}
