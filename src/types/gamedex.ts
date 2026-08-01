export type TrendStatus = "Rising" | "Stable" | "Dropping" | "Exploding";
export type PostCategory = "News" | "Update" | "Esports" | "Community" | "Patch Notes" | "Release" | "Rumor";

export interface Game {
  id: string;
  slug: string;
  title: string;
  genre: string;
  platforms: string[];
  releaseDate: string;
  coverTone: string;
  description: string;
  latestUpdates: string[];
  roadmap: string[];
}

export interface GameMetricDaily {
  id: string;
  gameId: string;
  date: string;
  playerCount: number;
  playerGrowth: number;
  twitchViewers: number;
  twitchGrowth: number;
  youtubeHype: number;
  redditActivity: number;
  newsVolume: number;
  releaseHype: number;
}

export type GameMetric = GameMetricDaily;

export interface TrendMetric {
  date: string;
  steam: number;
  twitch: number;
  youtube: number;
  reddit: number;
}

export interface GameNews {
  id: string;
  title: string;
  source: string;
  gameTag: string;
  summary: string;
  date: string;
  category: "Update" | "Esports" | "Release" | "Rumor" | "Community";
  gameId?: string;
  url?: string;
  imageUrl?: string;
  sourceType?: string;
  tags?: string[];
}

export interface GamePost {
  id: string;
  source: string;
  timeAgo: string;
  title: string;
  summary: string;
  gameTag: string;
  category: PostCategory;
  thumbnailTone: string;
  gameId?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
  isEditorial?: boolean;
}

export interface Streamer {
  id: string;
  name: string;
  platform: "Twitch";
  followers: number;
  currentGame: string;
  href: string;
  gameId?: string;
}

export interface YouTuber {
  id: string;
  name: string;
  subscribers: number;
  trendingTopic: string;
  href: string;
  gameId?: string;
}

export interface EsportsEvent {
  id: string;
  title: string;
  game: string;
  date: string;
  region: string;
  prizePool: string;
  href?: string;
  gameId?: string;
}

export interface RecentlyViewedGame {
  id: string;
  title: string;
  genre: string;
  href: string;
  coverTone: string;
}

export interface GameSource {
  id: string;
  name: string;
  status: "Healthy" | "Delayed" | "Offline";
  lastCollectedAt: string;
  cadence: string;
  gameId?: string;
  sourceType?: "rss" | "website" | "steam" | "trusted_site";
  url?: string | null;
  lastError?: string | null;
}

export interface TrendScore {
  gameId: string;
  score: number;
  status: TrendStatus;
  worthTryingScore: number;
}

export interface UpcomingGame {
  id: string;
  title: string;
  releaseDate: string;
  genre: string;
  platforms: string[];
  hypeScore: number;
  wishlistInterest: number;
  trailerUrl?: string;
  newsUrl?: string;
}

export interface GameWithTrend extends Game {
  trend: TrendScore;
  latestMetric: GameMetricDaily;
}

export interface GameDetail extends GameWithTrend {
  metrics: GameMetricDaily[];
  latestNews: GameNews[];
  latestPosts: GamePost[];
  topStreamers: Streamer[];
  topYouTubers: YouTuber[];
  esportsUpdates: EsportsEvent[];
  communitySentiment: {
    label: "Positive" | "Mixed" | "Negative";
    score: number;
    summary: string;
  };
  similarGames: GameWithTrend[];
}

export interface CollectorRunResult {
  collector: "steam" | "twitch" | "news" | "run";
  status: "completed" | "failed" | "partial";
  collectedAt: string;
  processedRecords: number;
  message: string;
  errors?: string[];
}
