import type {
  AnalysisBoard,
  AnalysisTrend,
  CategoryScore,
  MapScore,
  MetricScore,
  MetricSource,
  PlayerMetrics,
  ScoreCategoryId,
  ScoreLabel,
} from "@/lib/valorant-coach/types";

type PeerBand = { median: number; spread: number; higherIsBetter: boolean };

/** Rank-relative peer bands. Riot data later replaces medians with live cohort stats. */
const RANK_BANDS: Record<string, Record<string, PeerBand>> = {
  default: {
    headshotPercent: { median: 20, spread: 6, higherIsBetter: true },
    vandalAccuracyPercent: { median: 26, spread: 6, higherIsBetter: true },
    phantomAccuracyPercent: { median: 28, spread: 6, higherIsBetter: true },
    vandalHsPercent: { median: 21, spread: 6, higherIsBetter: true },
    phantomHsPercent: { median: 19, spread: 6, higherIsBetter: true },
    headHitShare: { median: 0.22, spread: 0.07, higherIsBetter: true },
    kd: { median: 1.0, spread: 0.22, higherIsBetter: true },
    adr: { median: 138, spread: 22, higherIsBetter: true },
    openingDuelWinRate: { median: 0.48, spread: 0.1, higherIsBetter: true },
    tradePercent: { median: 0.18, spread: 0.07, higherIsBetter: true },
    multikillRate: { median: 0.12, spread: 0.06, higherIsBetter: true },
    firstDeathRate: { median: 0.22, spread: 0.08, higherIsBetter: false },
    deathsPerRound: { median: 0.72, spread: 0.12, higherIsBetter: false },
    firstKillRate: { median: 0.14, spread: 0.06, higherIsBetter: true },
    acs: { median: 195, spread: 30, higherIsBetter: true },
    kast: { median: 0.7, spread: 0.08, higherIsBetter: true },
    winRate: { median: 0.5, spread: 0.08, higherIsBetter: true },
    mapWinRate: { median: 0.5, spread: 0.22, higherIsBetter: true },
  },
};

function bandFor(rank: string | null, key: string): PeerBand {
  return RANK_BANDS[rank ?? ""]?.[key] ?? RANK_BANDS.default[key] ?? {
    median: 50,
    spread: 15,
    higherIsBetter: true,
  };
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/** Map a raw metric onto 0–100 vs a comparable-rank band. Not a raw percent copy. */
export function normalizeMetricScore(
  raw: number | null,
  band: PeerBand,
): number | null {
  if (raw == null || !Number.isFinite(raw) || band.spread <= 0) return null;
  const delta = band.higherIsBetter ? raw - band.median : band.median - raw;
  return Math.round(clamp(50 + (delta / (band.spread * 1.6)) * 50));
}

export function scoreToLabel(score: number): ScoreLabel {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Average";
  return "Needs Work";
}

export function scoreToInsightRating(score: number): "strong" | "average" | "needs_work" | "weak" {
  if (score >= 80) return "strong";
  if (score >= 65) return "average";
  if (score >= 45) return "needs_work";
  return "weak";
}

function formatRaw(key: string, raw: number | null): string {
  if (raw == null) return "—";
  if (
    key.toLowerCase().includes("rate") ||
    key.toLowerCase().includes("share") ||
    key === "winRate" ||
    key === "kast" ||
    key === "tradePercent" ||
    key === "multikillRate"
  ) {
    return `${Math.round(raw * 100)}%`;
  }
  if (key.toLowerCase().includes("percent")) return `${Math.round(raw)}%`;
  if (key === "kd" || key === "deathsPerRound") return raw.toFixed(2);
  if (key === "adr" || key === "acs") return String(Math.round(raw));
  return Number.isInteger(raw) ? String(raw) : raw.toFixed(1);
}

function metric(
  key: string,
  label: string,
  raw: number | null,
  rank: string | null,
  source: MetricSource,
): MetricScore {
  const band = bandFor(rank, key);
  return {
    key,
    label,
    raw,
    display: formatRaw(key, raw),
    score: normalizeMetricScore(raw, band) ?? 50,
    higherIsBetter: band.higherIsBetter,
    source,
  };
}

function weightedScore(metrics: MetricScore[], weights: Record<string, number>): number {
  let total = 0;
  let weight = 0;
  for (const item of metrics) {
    const w = weights[item.key] ?? 1;
    total += item.score * w;
    weight += w;
  }
  return Math.round(clamp(weight ? total / weight : 50));
}

function trendFromScore(score: number): AnalysisTrend {
  if (score >= 70) return "up";
  if (score <= 44) return "down";
  return "stable";
}

function coachingRecommendation(id: ScoreCategoryId, score: number, metrics: MetricScore[]): string {
  const weakest = [...metrics].sort((a, b) => a.score - b.score)[0];
  const focus = weakest?.label ?? "this area";
  if (score >= 80) return `${focus} is already a strength. Hold the standard and train elsewhere.`;
  if (id === "aim") return `Crosshair height and first-bullet reps will lift ${focus.toLowerCase()}.`;
  if (id === "gunfights") return `Take isolated duels and reset after a lost swing. ${focus} is the leak.`;
  if (id === "survivability") return `Stop taking first contact for free. ${focus} is dragging rounds.`;
  if (id === "impact") return `Play for trades and mid-round presence. ${focus} is below your rank band.`;
  if (id === "consistency") return `One written focus per game. ${focus} is swinging too hard.`;
  return `Review defaults on your weakest maps. ${focus} is the current gap.`;
}

function category(
  id: ScoreCategoryId,
  label: string,
  metrics: MetricScore[],
  weights: Record<string, number>,
  source: MetricSource,
): CategoryScore {
  const score = weightedScore(metrics, weights);
  return {
    id,
    label,
    score,
    rating: scoreToLabel(score),
    trend: trendFromScore(score),
    source,
    metrics,
    recommendation: coachingRecommendation(id, score, metrics),
  };
}

export function buildAnalysisBoard(metrics: PlayerMetrics): AnalysisBoard {
  const rank = metrics.rank;
  const estimated: MetricSource = "sample";

  const aim = category(
    "aim",
    "Aim",
    [
      metric("headshotPercent", "Headshot Accuracy", metrics.headshotPercent, rank, metrics.source),
      metric("vandalAccuracyPercent", "Vandal accuracy", metrics.vandalAccuracyPercent, rank, estimated),
      metric("phantomAccuracyPercent", "Phantom accuracy", metrics.phantomAccuracyPercent, rank, estimated),
      metric("vandalHsPercent", "Vandal HS%", metrics.vandalHsPercent, rank, estimated),
      metric("phantomHsPercent", "Phantom HS%", metrics.phantomHsPercent, rank, estimated),
      metric("headHitShare", "Head / body mix", metrics.headHitShare, rank, estimated),
    ],
    {
      headshotPercent: 3,
      vandalAccuracyPercent: 1.5,
      phantomAccuracyPercent: 1.5,
      vandalHsPercent: 2,
      phantomHsPercent: 2,
      headHitShare: 1,
    },
    metrics.source,
  );

  const gunfights = category(
    "gunfights",
    "Gunfights",
    [
      metric("kd", "K/D", metrics.kd, rank, metrics.source),
      metric("adr", "Damage / round", metrics.adr, rank, estimated),
      metric("openingDuelWinRate", "Opening duels", metrics.openingDuelWinRate, rank, estimated),
      metric("tradePercent", "Trade rate", metrics.tradePercent, rank, estimated),
      metric("multikillRate", "Multikills", metrics.multikillRate, rank, estimated),
    ],
    { kd: 2, adr: 2, openingDuelWinRate: 2, tradePercent: 1, multikillRate: 1 },
    metrics.source,
  );

  const survivability = category(
    "survivability",
    "Survivability",
    [
      metric("firstDeathRate", "First Death", metrics.firstDeathRate, rank, metrics.source),
      metric("deathsPerRound", "Deaths / round", metrics.deathsPerRound, rank, estimated),
      metric("firstKillRate", "First kills", metrics.firstKillRate, rank, estimated),
    ],
    { firstDeathRate: 3, deathsPerRound: 2, firstKillRate: 1 },
    metrics.source,
  );

  const impact = category(
    "impact",
    "Impact",
    [
      metric("acs", "ACS", metrics.acs, rank, estimated),
      metric("kast", "KAST", metrics.kast, rank, estimated),
      metric("adr", "Damage / round", metrics.adr, rank, estimated),
    ],
    { acs: 3, kast: 2, adr: 1 },
    estimated,
  );

  const consistency = category(
    "consistency",
    "Consistency",
    [
      metric("winRate", "Win rate", metrics.winRate, rank, metrics.source),
      metric("kast", "KAST", metrics.kast, rank, estimated),
      metric("kd", "K/D stability", metrics.kd, rank, metrics.source),
    ],
    { winRate: 3, kast: 2, kd: 1 },
    metrics.source,
  );

  const maps = buildMapScores(metrics);
  const mapCategoryScore = maps.length
    ? Math.round(maps.reduce((sum, item) => sum + item.score10 * 10, 0) / maps.length)
    : 50;

  const map = {
    id: "map" as const,
    label: "Map Performance",
    score: mapCategoryScore,
    rating: scoreToLabel(mapCategoryScore),
    trend: trendFromScore(mapCategoryScore),
    source: estimated,
    metrics: maps.map((item) => ({
      key: `map_${item.map.toLowerCase()}`,
      label: item.map,
      raw: item.winRate,
      display: `${item.score10}/10`,
      score: item.score10 * 10,
      higherIsBetter: true,
      source: item.source,
    })),
    recommendation: coachingRecommendation(
      "map",
      mapCategoryScore,
      maps.map((item) => ({
        key: item.map,
        label: item.map,
        raw: item.winRate,
        display: `${item.score10}/10`,
        score: item.score10 * 10,
        higherIsBetter: true,
        source: item.source,
      })),
    ),
  };

  return {
    categories: [aim, gunfights, survivability, impact, consistency, map],
    maps,
    sourceNote: "estimated",
  };
}

function buildMapScores(metrics: PlayerMetrics): MapScore[] {
  const rates = metrics.mapWinRates ?? {};
  const names = Object.keys(rates).length
    ? Object.keys(rates)
    : ["Bind", "Icebox", "Ascent", "Haven", "Sunset"];
  const ordered = ["Bind", "Icebox", "Ascent", "Haven", "Sunset", ...names].filter(
    (name, index, list) => names.includes(name) && list.indexOf(name) === index,
  );

  return ordered.map((map) => {
    const winRate = rates[map] ?? 0.45;
    const score100 = normalizeMetricScore(winRate, bandFor(metrics.rank, "mapWinRate")) ?? 50;
    const score10 = Math.max(1, Math.min(10, Math.round(score100 / 10)));
    const attackBias = map === "Bind" || map === "Icebox" ? -0.08 : 0.02;
    return {
      map,
      score10,
      rating: scoreToLabel(score10 * 10),
      trend: score10 <= 4 ? "down" : score10 >= 7 ? "up" : "stable",
      source: "sample",
      winRate,
      attackWinRate: clamp((metrics.attackWinRate ?? 0.44) + attackBias, 0, 1),
      defenseWinRate: clamp((metrics.defenseWinRate ?? 0.52) - attackBias / 2, 0, 1),
      kd: Number((((metrics.kd ?? 1) - (0.5 - winRate)).toFixed(2))),
      firstKills: score10 >= 7 ? 5 : 2,
      firstDeaths: score10 <= 4 ? 6 : 3,
      agents: metrics.mainAgents.slice(0, 2),
      recentForm: score10 <= 4 ? "1W–4L" : score10 >= 7 ? "4W–1L" : "2W–2L",
      recommendation:
        score10 <= 4
          ? `Slow the attack default on ${map}. First contact is losing you the half.`
          : score10 >= 7
            ? `${map} is a comfort map. Keep the same default and review weaker maps.`
            : `Tighten attack vs defense on ${map}. One side is carrying the score.`,
    };
  });
}

export function weakestCategory(board: AnalysisBoard): CategoryScore | null {
  return [...board.categories].sort((a, b) => a.score - b.score)[0] ?? null;
}
