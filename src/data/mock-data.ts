import type {
  EsportsEvent,
  Game,
  GameMetricDaily,
  GameNews,
  GamePost,
  GameSource,
  RecentlyViewedGame,
  Streamer,
  UpcomingGame,
  YouTuber,
} from "@/types/gamedex";

export const games: Game[] = [
  {
    id: "genshin-impact",
    slug: "genshin-impact",
    title: "Genshin Impact",
    genre: "Action RPG",
    platforms: ["PC", "PlayStation", "Mobile"],
    releaseDate: "2020-09-28",
    coverTone: "from-cyan-500/35 to-indigo-500/20",
    description: "Open-world action RPG with a massive live-service audience and steady official update cadence.",
    latestUpdates: ["Genshin Feed RSS registered", "HoYoLAB feed registered", "Official news tracking enabled"],
    roadmap: ["Track official posts", "Add YouTube later", "Keep X/Twitter disabled"],
  },
  {
    id: "free-fire",
    slug: "free-fire",
    title: "Free Fire",
    genre: "Battle Royale",
    platforms: ["Mobile"],
    releaseDate: "2017-12-04",
    coverTone: "from-orange-500/35 to-amber-500/20",
    description: "Global mobile battle royale with frequent patch notes, collaborations, and esports events.",
    latestUpdates: ["Garena official news registered", "Website collector ready", "Patch notes tracked"],
    roadmap: ["Track official posts", "Add esports sources later", "Keep X/Twitter disabled"],
  },
  {
    id: "wuthering-waves",
    slug: "wuthering-waves",
    title: "Wuthering Waves",
    genre: "Action RPG",
    platforms: ["PC", "PlayStation", "Mobile"],
    releaseDate: "2024-05-23",
    coverTone: "from-slate-400/30 to-cyan-500/20",
    description: "Fast-combat open-world RPG with official site updates and Steam news available for collection.",
    latestUpdates: ["Official news page registered", "Steam news registered", "Website collector ready"],
    roadmap: ["Track official posts", "Track Steam news", "Add YouTube later"],
  },
  {
    id: "valorant",
    slug: "valorant",
    title: "Valorant",
    genre: "Tactical Shooter",
    platforms: ["PC", "Console"],
    releaseDate: "2020-06-02",
    coverTone: "from-rose-500/35 to-orange-500/20",
    description: "Competitive shooter with dependable esports spikes and a durable official news cadence.",
    latestUpdates: ["Official Riot news source registered", "Website collector ready", "RSS not required"],
    roadmap: ["Track official posts", "Add esports sources later", "Keep X/Twitter disabled"],
  },
  {
    id: "league-of-legends",
    slug: "league-of-legends",
    title: "League of Legends",
    genre: "MOBA",
    platforms: ["PC"],
    releaseDate: "2009-10-27",
    coverTone: "from-blue-500/35 to-indigo-500/20",
    description: "Massive competitive ecosystem with frequent official Riot news, patch notes, and event updates.",
    latestUpdates: ["Official Riot news source registered", "Website collector ready", "RSS not required"],
    roadmap: ["Track official posts", "Add esports sources later", "Keep X/Twitter disabled"],
  },
];

const metricSeries = {
  "genshin-impact": [68, 70, 71, 72, 73, 75, 76],
  "wuthering-waves": [54, 58, 63, 68, 72, 77, 84],
  "free-fire": [62, 64, 66, 68, 70, 73, 76],
  valorant: [59, 60, 61, 60, 63, 65, 66],
  "league-of-legends": [58, 57, 58, 59, 61, 60, 62],
} as const;

export const metrics: GameMetricDaily[] = Object.entries(metricSeries).flatMap(
  ([gameId, values], gameIndex) =>
    values.map((value, index) => ({
      id: `${gameId}-${index + 1}`,
      gameId,
      date: `2026-05-${String(index + 9).padStart(2, "0")}`,
      playerCount: 45000 + gameIndex * 17000 + value * 950,
      playerGrowth: Number((value * 0.7 - 12 + index * 0.5).toFixed(1)),
      twitchViewers: 12000 + gameIndex * 5400 + value * 420,
      twitchGrowth: Number((value * 0.55 - 8 + index * 0.4).toFixed(1)),
      youtubeHype: Math.min(100, value + 6 + index),
      redditActivity: Math.min(100, Math.round(value * 0.88 + index * 1.5)),
      newsVolume: Math.min(100, Math.round(value * 0.6 + 10)),
      releaseHype: 12,
    })),
);

export const posts: GamePost[] = [
  {
    id: "editorial-genshin-banners",
    source: "Gamedex Editorial",
    author: "Gamedex Editorial",
    timeAgo: "2h ago",
    publishedAt: "2026-06-29T14:00:00.000Z",
    title: "Genshin 6.7 banner value: who is worth pulling for F2P players?",
    summary:
      "A quick breakdown of the upcoming character banners, rerun timing, and whether saving for the next patch is the smarter move for low-spenders.",
    gameTag: "Genshin Impact",
    category: "Patch Notes",
    thumbnailTone: "from-cyan-500/40 to-indigo-600/25",
    gameId: "genshin-impact",
    isEditorial: true,
  },
  {
    id: "editorial-wuwa-pulls",
    source: "Gamedex Editorial",
    author: "Gamedex Editorial",
    timeAgo: "5h ago",
    publishedAt: "2026-06-29T11:00:00.000Z",
    title: "WuWa convene check: is the new 5-star worth your pulls?",
    summary:
      "We compare kit utility, team slots, and future rerun risk so you can decide if this banner deserves your astrites or a skip.",
    gameTag: "Wuthering Waves",
    category: "Update",
    thumbnailTone: "from-slate-500/35 to-cyan-500/25",
    gameId: "wuthering-waves",
    isEditorial: true,
  },
  {
    id: "editorial-valorant-patch",
    source: "Gamedex Editorial",
    author: "Gamedex Editorial",
    timeAgo: "8h ago",
    publishedAt: "2026-06-29T08:00:00.000Z",
    title: "Valorant patch breakdown: agent tweaks that will reshape ranked",
    summary:
      "The latest balance changes hit duelists hardest. Here is what ranked players should practice before the meta settles.",
    gameTag: "Valorant",
    category: "Patch Notes",
    thumbnailTone: "from-rose-500/40 to-orange-500/25",
    gameId: "valorant",
    isEditorial: true,
  },
  {
    id: "editorial-lol-meta",
    source: "Gamedex Editorial",
    author: "Gamedex Editorial",
    timeAgo: "12h ago",
    publishedAt: "2026-06-29T04:00:00.000Z",
    title: "League meta update: top lane picks climbing after the latest patch",
    summary:
      "Tank items and teleport timings are shifting the solo queue landscape. These champions are gaining the most win rate this week.",
    gameTag: "League of Legends",
    category: "Update",
    thumbnailTone: "from-blue-500/40 to-indigo-600/25",
    gameId: "league-of-legends",
    isEditorial: true,
  },
  {
    id: "editorial-free-fire-ob",
    source: "Gamedex Editorial",
    author: "Gamedex Editorial",
    timeAgo: "1d ago",
    publishedAt: "2026-06-28T16:00:00.000Z",
    title: "Free Fire OB54: ranked changes and loadout shifts to watch",
    summary:
      "The new patch touches weapon tuning and ranked pacing. Here is what competitive squads should adjust before grinding push.",
    gameTag: "Free Fire",
    category: "Patch Notes",
    thumbnailTone: "from-orange-500/40 to-amber-500/25",
    gameId: "free-fire",
    isEditorial: true,
  },
];

export const news: GameNews[] = [
  {
    id: "news-genshin",
    title: "Genshin Impact official feeds registered",
    source: "Official Tracker",
    gameTag: "Genshin Impact",
    summary: "Genshin Feed and HoYoLAB sources are available as fallback seed news until live collector data exists.",
    date: "2026-05-15",
    category: "Update",
    gameId: "genshin-impact",
  },
  {
    id: "news-free-fire",
    title: "Free Fire official news source registered",
    source: "Official Tracker",
    gameTag: "Free Fire",
    summary: "Garena's official news page is available for website-based collection.",
    date: "2026-05-15",
    category: "Update",
    gameId: "free-fire",
  },
  {
    id: "news-wuwa",
    title: "Wuthering Waves official and Steam sources registered",
    source: "Official Tracker",
    gameTag: "Wuthering Waves",
    summary: "Wuthering Waves keeps the official news page and adds Steam news where available.",
    date: "2026-05-14",
    category: "Update",
    gameId: "wuthering-waves",
  },
  {
    id: "news-valorant",
    title: "Valorant official news source remains enabled",
    source: "Official Tracker",
    gameTag: "Valorant",
    summary: "Valorant keeps Riot official news as its no-key source.",
    date: "2026-05-13",
    category: "Esports",
    gameId: "valorant",
  },
  {
    id: "news-lol",
    title: "League of Legends official news source remains enabled",
    source: "Official Tracker",
    gameTag: "League of Legends",
    summary: "League keeps Riot official news as its no-key source.",
    date: "2026-05-13",
    category: "Update",
    gameId: "league-of-legends",
  },
];

export const streamers: Streamer[] = [
  { id: "streamer-valorant", name: "RiotMako", platform: "Twitch", followers: 2100000, currentGame: "Valorant", href: "#", gameId: "valorant" },
  { id: "streamer-wuwa", name: "NeroPulse", platform: "Twitch", followers: 1400000, currentGame: "Wuthering Waves", href: "#", gameId: "wuthering-waves" },
  { id: "streamer-lol", name: "LaneCraft", platform: "Twitch", followers: 1800000, currentGame: "League of Legends", href: "#", gameId: "league-of-legends" },
];

export const youtubers: YouTuber[] = [
  { id: "yt-genshin", name: "TeyvatNotes", subscribers: 2800000, trendingTopic: "Genshin update tracking", href: "#", gameId: "genshin-impact" },
  { id: "yt-free-fire", name: "BooyahBrief", subscribers: 3200000, trendingTopic: "Free Fire OB patch notes", href: "#", gameId: "free-fire" },
  { id: "yt-wuwa", name: "PatchPulse", subscribers: 2500000, trendingTopic: "Wuthering Waves patch", href: "#", gameId: "wuthering-waves" },
];

export const esportsEvents: EsportsEvent[] = [
  { id: "event-valorant", title: "Valorant APAC Finals", game: "Valorant", date: "2026-05-18", region: "APAC", prizePool: "$500K", href: "#", gameId: "valorant" },
  { id: "event-lol", title: "MSI Knockout Stage", game: "League of Legends", date: "2026-05-20", region: "Global", prizePool: "$2M", href: "#", gameId: "league-of-legends" },
];

export const recentlyViewedGames: RecentlyViewedGame[] = [
  { id: "recent-genshin", title: "Genshin Impact", genre: "Action RPG", href: "/games/genshin-impact", coverTone: "from-cyan-500/30 to-indigo-500/15" },
  { id: "recent-free-fire", title: "Free Fire", genre: "Battle Royale", href: "/games/free-fire", coverTone: "from-orange-500/30 to-amber-500/15" },
  { id: "recent-wuwa", title: "Wuthering Waves", genre: "Action RPG", href: "/games/wuthering-waves", coverTone: "from-slate-400/25 to-cyan-500/15" },
  { id: "recent-valorant", title: "Valorant", genre: "Tactical Shooter", href: "/games/valorant", coverTone: "from-rose-500/30 to-orange-500/15" },
];

export const sources: GameSource[] = [
  { id: "hoyolab-rss", name: "HoYoLAB RSS", status: "Healthy", lastCollectedAt: "2026-05-15T08:10:00.000Z", cadence: "60 min" },
  { id: "genshin-feed", name: "Genshin Feed", status: "Healthy", lastCollectedAt: "2026-05-15T08:12:00.000Z", cadence: "60 min" },
  { id: "official-sites", name: "Official Sites", status: "Healthy", lastCollectedAt: "2026-05-15T08:08:00.000Z", cadence: "60 min" },
  { id: "steam-news", name: "Steam News", status: "Healthy", lastCollectedAt: "2026-05-15T08:05:00.000Z", cadence: "60 min" },
];

export const upcomingGames: UpcomingGame[] = [];
