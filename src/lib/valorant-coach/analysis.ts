import { scoreToInsightRating } from "@/lib/valorant-coach/scoring";
import type { AnalysisBoard, AnalysisInsight, PlayerMetrics } from "@/lib/valorant-coach/types";

function formatPercent(value: number) {
  return `${Math.round(value * (value <= 1 ? 100 : 1))}%`;
}

/** Insights stay for the plan engine. UI reads `board`, not these paragraphs. */
export function buildAnalysisInsights(metrics: PlayerMetrics, board: AnalysisBoard): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];
  const byId = Object.fromEntries(board.categories.map((item) => [item.id, item]));

  const aim = byId.aim;
  if (aim) {
    insights.push({
      metricKey: "headshot_pct",
      category: "aim",
      label: "Headshot Accuracy",
      value: metrics.headshotPercent != null ? `${metrics.headshotPercent}%` : aim.score,
      rating: scoreToInsightRating(aim.score),
      trend: aim.trend,
      explanation: aim.recommendation,
      priority: aim.score >= 65 ? 8 : 1,
      source: aim.source,
    });
  }

  const survivability = byId.survivability;
  if (survivability) {
    insights.push({
      metricKey: "first_death_rate",
      category: "survivability",
      label: "First Deaths",
      value: metrics.firstDeathRate != null ? formatPercent(metrics.firstDeathRate) : survivability.score,
      rating: scoreToInsightRating(survivability.score),
      trend: survivability.trend,
      explanation: survivability.recommendation,
      priority: survivability.score >= 65 ? 7 : 1,
      source: survivability.source,
    });
  }

  const gunfights = byId.gunfights;
  if (gunfights) {
    insights.push({
      metricKey: "kd",
      category: "gunfights",
      label: "Gunfight Impact",
      value: metrics.kd != null ? metrics.kd.toFixed(2) : gunfights.score,
      rating: scoreToInsightRating(gunfights.score),
      trend: gunfights.trend,
      explanation: gunfights.recommendation,
      priority: 3,
      source: gunfights.source,
    });
  }

  const consistency = byId.consistency;
  if (consistency) {
    insights.push({
      metricKey: "consistency",
      category: "consistency",
      label: "Round Conversion",
      value: metrics.winRate != null ? formatPercent(metrics.winRate) : consistency.score,
      rating: scoreToInsightRating(consistency.score),
      trend: consistency.trend,
      explanation: consistency.recommendation,
      priority: consistency.score >= 65 ? 5 : 2,
      source: consistency.source,
    });
  }

  const weakestMap = [...board.maps].sort((a, b) => a.score10 - b.score10)[0];
  if (weakestMap) {
    insights.push({
      metricKey: `map_${weakestMap.map.toLowerCase()}`,
      category: "map",
      label: weakestMap.map,
      value: `${weakestMap.score10}/10`,
      rating: scoreToInsightRating(weakestMap.score10 * 10),
      trend: weakestMap.trend,
      explanation: weakestMap.recommendation,
      priority: weakestMap.score10 <= 4 ? 2 : 6,
      source: weakestMap.source,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
