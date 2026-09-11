import type { MatchReviewCard, PlayerMetrics } from "@/lib/valorant-coach/types";

/** Clearly labeled estimated stats for UI while live match data is unavailable. */
export const SAMPLE_PLAYER_METRICS: Pick<
  PlayerMetrics,
  | "headshotPercent"
  | "firstDeathRate"
  | "kd"
  | "winRate"
  | "acs"
  | "recentForm"
  | "mapWinRates"
  | "attackWinRate"
  | "defenseWinRate"
  | "agentRatings"
  | "vandalAccuracyPercent"
  | "phantomAccuracyPercent"
  | "vandalHsPercent"
  | "phantomHsPercent"
  | "headHitShare"
  | "bodyHitShare"
  | "deathsPerRound"
  | "firstKillRate"
  | "adr"
  | "openingDuelWinRate"
  | "tradePercent"
  | "multikillRate"
  | "kast"
> = {
  headshotPercent: 21,
  firstDeathRate: 0.28,
  kd: 1.04,
  winRate: 0.47,
  acs: 198,
  recentForm: "2W–3L",
  mapWinRates: {
    Bind: 0.36,
    Icebox: 0.28,
    Ascent: 0.68,
    Haven: 0.48,
    Sunset: 0.44,
  },
  attackWinRate: 0.42,
  defenseWinRate: 0.53,
  agentRatings: {
    Jett: "average",
    Reyna: "needs_work",
    Sage: "strong",
  },
  vandalAccuracyPercent: 24,
  phantomAccuracyPercent: 27,
  vandalHsPercent: 22,
  phantomHsPercent: 19,
  headHitShare: 0.21,
  bodyHitShare: 0.58,
  deathsPerRound: 0.76,
  firstKillRate: 0.13,
  adr: 141,
  openingDuelWinRate: 0.44,
  tradePercent: 0.16,
  multikillRate: 0.11,
  kast: 0.68,
};

export const SAMPLE_MATCHES: MatchReviewCard[] = [
  {
    id: "sample-1",
    map: "Bind",
    agent: "Jett",
    result: "loss",
    kda: { k: 14, d: 18, a: 4 },
    score: "9–13",
    acs: 176,
    headshotPercent: 17,
    damage: 3820,
    firstKills: 2,
    firstDeaths: 6,
    observations: ["Died first on four attack rounds.", "Low first-bullet impact on A short."],
    source: "sample",
  },
  {
    id: "sample-2",
    map: "Ascent",
    agent: "Jett",
    result: "win",
    kda: { k: 21, d: 14, a: 5 },
    score: "13–10",
    acs: 224,
    headshotPercent: 24,
    damage: 4510,
    firstKills: 5,
    firstDeaths: 3,
    observations: ["Better mid control.", "Aim held up when taking isolated duels."],
    source: "sample",
  },
  {
    id: "sample-3",
    map: "Haven",
    agent: "Sage",
    result: "loss",
    kda: { k: 11, d: 16, a: 9 },
    score: "11–13",
    acs: 168,
    headshotPercent: 19,
    damage: 3012,
    firstKills: 1,
    firstDeaths: 4,
    observations: ["Utility value was fine; late rotates lost C."],
    source: "sample",
  },
];
