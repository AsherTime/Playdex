export type MetricSource = "questionnaire" | "sample" | "riot";

export type AnalysisRating = "strong" | "average" | "needs_work" | "weak";

export type AnalysisCategory =
  | "aim"
  | "gunfights"
  | "survivability"
  | "impact"
  | "consistency"
  | "agent"
  | "map"
  | "side"
  | "form";

export type AnalysisTrend = "up" | "down" | "stable" | "unknown";

export type ScoreLabel = "Excellent" | "Good" | "Average" | "Needs Work";

export type ScoreCategoryId =
  | "aim"
  | "gunfights"
  | "survivability"
  | "impact"
  | "consistency"
  | "map";

export type MetricScore = {
  key: string;
  label: string;
  raw: number | null;
  display: string;
  score: number;
  higherIsBetter: boolean;
  source: MetricSource;
};

export type CategoryScore = {
  id: ScoreCategoryId;
  label: string;
  score: number;
  rating: ScoreLabel;
  trend: AnalysisTrend;
  source: MetricSource;
  metrics: MetricScore[];
  recommendation: string;
};

export type MapScore = {
  map: string;
  score10: number;
  rating: ScoreLabel;
  trend: AnalysisTrend;
  source: MetricSource;
  winRate: number | null;
  attackWinRate: number | null;
  defenseWinRate: number | null;
  kd: number | null;
  firstKills: number | null;
  firstDeaths: number | null;
  agents: string[];
  recentForm: string | null;
  recommendation: string;
};

export type AnalysisBoard = {
  categories: CategoryScore[];
  maps: MapScore[];
  sourceNote: "estimated" | "riot";
};

export type AnalysisInsight = {
  metricKey: string;
  category: AnalysisCategory;
  label: string;
  value: string | number | null;
  rating: AnalysisRating;
  trend: AnalysisTrend;
  explanation: string;
  priority: number;
  source: MetricSource;
};

export type PlayerMetrics = {
  source: MetricSource;
  rank: string | null;
  rankSource: MetricSource;
  mainAgents: string[];
  role: string | null;
  headshotPercent: number | null;
  firstDeathRate: number | null;
  kd: number | null;
  winRate: number | null;
  acs: number | null;
  recentForm: string | null;
  strongestArea: string | null;
  biggestWeakness: string | null;
  mapWinRates: Record<string, number> | null;
  attackWinRate: number | null;
  defenseWinRate: number | null;
  agentRatings: Record<string, AnalysisRating> | null;
  vandalAccuracyPercent: number | null;
  phantomAccuracyPercent: number | null;
  vandalHsPercent: number | null;
  phantomHsPercent: number | null;
  headHitShare: number | null;
  bodyHitShare: number | null;
  deathsPerRound: number | null;
  firstKillRate: number | null;
  adr: number | null;
  openingDuelWinRate: number | null;
  tradePercent: number | null;
  multikillRate: number | null;
  kast: number | null;
};

export type MatchReviewCard = {
  id: string;
  map: string;
  agent: string;
  result: "win" | "loss" | "draw";
  kda: { k: number; d: number; a: number };
  score?: string;
  acs?: number;
  headshotPercent?: number;
  damage?: number;
  firstKills?: number;
  firstDeaths?: number;
  observations: string[];
  source: MetricSource;
};

export type TrainingRecommendation = {
  problemKey: string;
  diagnosis: string;
  title: string;
  duration: string;
  reason: string;
  kind: "warmup" | "drill" | "deathmatch" | "ranked" | "review" | "utility";
  priority: number;
};

export type ProgressPoint = {
  label: string;
  value: number;
};

export type ProgressSeries = {
  key: string;
  label: string;
  source: MetricSource;
  points: ProgressPoint[];
};

export type CoachSnapshot = {
  metrics: PlayerMetrics;
  insights: AnalysisInsight[];
  recommendations: TrainingRecommendation[];
  matches: MatchReviewCard[];
  progress: ProgressSeries[];
  board: AnalysisBoard;
  riotConnected: boolean;
};
