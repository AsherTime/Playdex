import { DashboardLayout } from "@/components/dashboard-layout";
import { GameRankCard } from "@/components/game-rank-card";
import { OverviewCard } from "@/components/overview-card";
import { RightSidebar } from "@/components/right-sidebar";
import { SectionHeader } from "@/components/section-header";
import { TrendChart } from "@/components/trend-chart";
import { news } from "@/data/mock-data";
import {
  getFastestRisingGames,
  getGamesLosingHype,
  getGenreBreakdown,
  getPlatformBreakdown,
  getPlatformTrendSeries,
  getRedditTrendingGames,
  getSteamTrendingGames,
  getTrendingGames,
  getTwitchTrendingGames,
  getUpcomingHypeGames,
  getYouTubeTrendingGames,
} from "@/lib/games";
import { getTopStreamers, getTopYouTubers, getUpcomingEsportsEvents } from "@/lib/content";
import { formatCompactNumber } from "@/utils/formatters";

export default function TrendingPage() {
  const overall = getTrendingGames();
  const steam = getSteamTrendingGames();
  const twitch = getTwitchTrendingGames();
  const youtube = getYouTubeTrendingGames();
  const reddit = getRedditTrendingGames();
  const hype = getUpcomingHypeGames();
  const latestMetrics = overall.map((game) => game.latestMetric);

  return (
    <DashboardLayout
      rightSidebar={
        <RightSidebar
          streamers={getTopStreamers()}
          creators={getTopYouTubers()}
          risingGames={getFastestRisingGames()}
          droppingGames={getGamesLosingHype()}
        />
      }
    >
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Signals"
          title="Trending"
          description="The analytical layer: overview cards, ranked channels, and cross-platform movement."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <OverviewCard label="Games Tracked" value={overall.length} />
          <OverviewCard label="Trending Games" value={overall.filter((game) => game.trend.score >= 60).length} />
          <OverviewCard label="News Today" value={news.length} />
          <OverviewCard label="Esports Events" value={getUpcomingEsportsEvents().length} />
          <OverviewCard
            label="Total Steam Players"
            value={formatCompactNumber(latestMetrics.reduce((sum, metric) => sum + metric.playerCount, 0))}
          />
          <OverviewCard
            label="Total Twitch Viewers"
            value={formatCompactNumber(latestMetrics.reduce((sum, metric) => sum + metric.twitchViewers, 0))}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <TrendChart kind="activity" activityData={getPlatformTrendSeries()} />
          <TrendChart kind="games" gameData={overall} />
          <TrendChart kind="genres" breakdownData={getGenreBreakdown()} />
          <TrendChart kind="platforms" breakdownData={getPlatformBreakdown()} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <RankSection title="Overall Trending" games={overall} />
          <RankSection title="Steam Trending" games={steam} />
          <RankSection title="Twitch Trending" games={twitch} />
          <RankSection title="YouTube Trending" games={youtube} />
          <RankSection title="Reddit / Community Trending" games={reddit} />
          <RankSection title="Upcoming Hype" games={hype} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function RankSection({ title, games }: { title: string; games: ReturnType<typeof getTrendingGames> }) {
  return (
    <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-medium text-white">{title}</h2>
      <div className="space-y-3">
        {games.slice(0, 4).map((game, index) => (
          <GameRankCard key={game.id} game={game} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
