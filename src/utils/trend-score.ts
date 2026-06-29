export interface TrendScoreInput {
  playerGrowth: number;
  twitchGrowth: number;
  youtubeHype: number;
  redditActivity: number;
  newsVolume: number;
  releaseHype?: number;
}

export function calculateTrendScore({
  playerGrowth,
  twitchGrowth,
  youtubeHype,
  redditActivity,
  newsVolume,
  releaseHype = 0,
}: TrendScoreInput) {
  const baseScore =
    playerGrowth * 0.3 +
    twitchGrowth * 0.25 +
    youtubeHype * 0.2 +
    redditActivity * 0.15 +
    newsVolume * 0.1;

  const launchWindowBoost = releaseHype * 0.1;
  const normalized = Math.max(0, Math.min(100, baseScore + launchWindowBoost));

  return Math.round(normalized * 10) / 10;
}

export function getTrendStatus(score: number) {
  if (score >= 80) return "Exploding" as const;
  if (score >= 60) return "Rising" as const;
  if (score >= 40) return "Stable" as const;
  return "Dropping" as const;
}
