import { buildAnalysisInsights } from "@/lib/valorant-coach/analysis";
import { practiceBudgetMinutes } from "@/lib/valorant-coach/practice-time";
import { metricsFromQuestionnaire } from "@/lib/valorant-coach/questionnaire-metrics";
import { buildProgressSeries } from "@/lib/valorant-coach/progress";
import { recommendationsFromInsights, todaysFocus } from "@/lib/valorant-coach/recommendations";
import { isRiotAccountConnected } from "@/lib/valorant-coach/riot-source";
import { SAMPLE_MATCHES } from "@/lib/valorant-coach/sample-data";
import { buildAnalysisBoard } from "@/lib/valorant-coach/scoring";
import type { CoachSnapshot } from "@/lib/valorant-coach/types";
import type { ImproveQuestionnaire, ImprovementPlan } from "@/types/valorant-improve";

export function buildCoachSnapshot(
  questionnaire: ImproveQuestionnaire | null,
  plan: ImprovementPlan | null,
  range: 7 | 30 | 90 = 7,
): CoachSnapshot {
  const metrics = metricsFromQuestionnaire(questionnaire);
  const board = buildAnalysisBoard(metrics);
  const insights = buildAnalysisInsights(metrics, board);
  const recommendations = recommendationsFromInsights(
    insights,
    practiceBudgetMinutes(questionnaire?.practiceTime ?? plan?.summary.practiceTime),
  );

  return {
    metrics,
    insights,
    recommendations,
    matches: SAMPLE_MATCHES,
    progress: buildProgressSeries(plan, insights, range),
    board,
    riotConnected: isRiotAccountConnected(),
  };
}

export { todaysFocus, isRiotAccountConnected };
export type {
  AnalysisBoard,
  AnalysisInsight,
  CoachSnapshot,
  TrainingRecommendation,
} from "@/lib/valorant-coach/types";
