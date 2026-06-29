import {
  esportsEvents,
  games,
  metrics,
  posts,
  streamers,
  upcomingGames,
  youtubers,
} from "@/data/mock-data";
import type {
  GameDetail,
  GameMetricDaily,
  GamePost,
  GameWithTrend,
  TrendMetric,
} from "@/types/gamedex";
import { getLatestNewsForGame } from "@/lib/news";
import { calculateTrendScore, getTrendStatus } from "@/utils/trend-score";

function getLatestMetric(gameId: string): GameMetricDaily {
  const gameMetrics = metrics.filter((metric) => metric.gameId === gameId);
  return gameMetrics[gameMetrics.length - 1];
}

function enrichGame(gameId: string): GameWithTrend {
  const game = games.find((item) => item.id === gameId);
  if (!game) throw new Error(`Unknown game: ${gameId}`);

  const latestMetric = getLatestMetric(game.id);
  const score = calculateTrendScore(latestMetric);

  return {
    ...game,
    latestMetric,
    trend: {
      gameId: game.id,
      score,
      status: getTrendStatus(score),
      worthTryingScore: Math.min(
        100,
        Math.round(score * 0.72 + latestMetric.youtubeHype * 0.18 + latestMetric.redditActivity * 0.1),
      ),
    },
  };
}

export function getAllGames() {
  return games.map((game) => enrichGame(game.id));
}

export function getTrendingGames() {
  return getAllGames().sort((a, b) => b.trend.score - a.trend.score);
}

export function getSteamTrendingGames() {
  return getAllGames().sort((a, b) => b.latestMetric.playerGrowth - a.latestMetric.playerGrowth);
}

export function getTwitchTrendingGames() {
  return getAllGames().sort((a, b) => b.latestMetric.twitchGrowth - a.latestMetric.twitchGrowth);
}

export function getYouTubeTrendingGames() {
  return getAllGames().sort((a, b) => b.latestMetric.youtubeHype - a.latestMetric.youtubeHype);
}

export function getRedditTrendingGames() {
  return getAllGames().sort((a, b) => b.latestMetric.redditActivity - a.latestMetric.redditActivity);
}

export function getUpcomingHypeGames() {
  return getAllGames().sort((a, b) => b.latestMetric.releaseHype - a.latestMetric.releaseHype);
}

export function getFastestRisingGames() {
  return getSteamTrendingGames().slice(0, 4);
}

export function getGamesLosingHype() {
  return getTrendingGames()
    .filter((game) => game.trend.status === "Dropping")
    .sort((a, b) => a.trend.score - b.trend.score);
}

export function getPlatformTrendSeries(): TrendMetric[] {
  const dates = [...new Set(metrics.map((metric) => metric.date))].sort();

  return dates.map((date) => {
    const dayMetrics = metrics.filter((metric) => metric.date === date);
    const average = (selector: (metric: GameMetricDaily) => number) =>
      Math.round(dayMetrics.reduce((sum, metric) => sum + selector(metric), 0) / dayMetrics.length);

    return {
      date,
      steam: average((metric) => metric.playerGrowth),
      twitch: average((metric) => metric.twitchGrowth),
      youtube: average((metric) => metric.youtubeHype),
      reddit: average((metric) => metric.redditActivity),
    };
  });
}

export function getGenreBreakdown() {
  return Object.entries(
    games.reduce<Record<string, number>>((accumulator, game) => {
      accumulator[game.genre] = (accumulator[game.genre] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
}

export function getPlatformBreakdown() {
  return Object.entries(
    games.reduce<Record<string, number>>((accumulator, game) => {
      game.platforms.forEach((platform) => {
        accumulator[platform] = (accumulator[platform] ?? 0) + 1;
      });
      return accumulator;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
}

function newsToPosts(newsItems: Awaited<ReturnType<typeof getLatestNewsForGame>>): GamePost[] {
  return newsItems.map((item) => ({
    id: item.id,
    source: item.source,
    timeAgo: new Date(item.date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    title: item.title,
    summary: item.summary,
    gameTag: item.gameTag,
    category: item.category,
    thumbnailTone: "from-cyan-500/30 to-indigo-500/15",
    gameId: item.gameId,
    url: item.url,
  }));
}

export async function getGameDetail(gameId: string): Promise<GameDetail | undefined> {
  const base = games.find((game) => game.id === gameId || game.slug === gameId);
  if (!base) return undefined;

  const enriched = enrichGame(base.id);
  const gameMetrics = metrics.filter((metric) => metric.gameId === base.id);
  const latestNews = await getLatestNewsForGame(base.id, 4);
  const latestPosts = latestNews.length
    ? newsToPosts(latestNews)
    : posts.filter((item) => item.gameId === base.id).slice(0, 4);
  const similarGames = getTrendingGames()
    .filter((game) => game.id !== base.id && game.genre === base.genre)
    .slice(0, 3);

  const sentimentScore = Math.round(
    enriched.latestMetric.redditActivity * 0.55 + enriched.latestMetric.youtubeHype * 0.45,
  );

  return {
    ...enriched,
    metrics: gameMetrics,
    latestNews,
    latestPosts,
    topStreamers: streamers.filter((streamer) => streamer.gameId === base.id),
    topYouTubers: youtubers.filter((creator) => creator.gameId === base.id),
    esportsUpdates: esportsEvents.filter((event) => event.gameId === base.id),
    communitySentiment: {
      label: sentimentScore >= 70 ? "Positive" : sentimentScore >= 50 ? "Mixed" : "Negative",
      score: sentimentScore,
      summary:
        sentimentScore >= 70
          ? "Conversation is constructive, creator coverage is strong, and discovery loops are widening."
          : sentimentScore >= 50
            ? "Attention is healthy, but discussion is split between excitement and wait-and-see caution."
            : "The audience is cooling, with more churn signals than organic enthusiasm right now.",
    },
    similarGames,
  };
}

export function getUpcomingGames() {
  return [...upcomingGames].sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
  );
}
