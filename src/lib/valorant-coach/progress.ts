import type { AnalysisInsight, MetricSource, ProgressSeries } from "@/lib/valorant-coach/types";
import type { ImprovementPlan } from "@/types/valorant-improve";

function completionRate(plan: ImprovementPlan | null): number {
  if (!plan) return 0;
  const tasks = plan.days.flatMap((day) => day.tasks);
  if (!tasks.length) return 0;
  const done = Object.values(plan.completedTasks).reduce((sum, ids) => sum + ids.length, 0);
  return Math.round((done / tasks.length) * 100);
}

function series(
  key: string,
  label: string,
  source: MetricSource,
  current: number,
  days: 7 | 30 | 90,
): ProgressSeries {
  const count = days === 7 ? 7 : days === 30 ? 6 : 8;
  const points = Array.from({ length: count }, (_, index) => {
    const drift = (index - count + 1) * 3;
    return {
      label: days === 7 ? `D${index + 1}` : days === 30 ? `W${index + 1}` : `M${index + 1}`,
      value: Math.max(10, Math.min(92, current + drift)),
    };
  });
  return { key, label, source, points };
}

export function buildProgressSeries(
  plan: ImprovementPlan | null,
  insights: AnalysisInsight[],
  range: 7 | 30 | 90,
): ProgressSeries[] {
  const training = completionRate(plan);
  const aim = insights.find((item) => item.metricKey === "headshot_pct");
  const survive = insights.find((item) => item.metricKey === "first_death_rate");
  const consistency = insights.find((item) => item.metricKey === "consistency");

  const score = (insight: AnalysisInsight | undefined, invert = false) => {
    if (!insight) return 50;
    const map = { strong: 82, average: 64, needs_work: 42, weak: 28 };
    const value = map[insight.rating];
    return invert ? 100 - value + 20 : value;
  };

  return [
    series("training_completion", "Training completion", "questionnaire", training || 18, range),
    series("aim", "Aim", aim?.source ?? "sample", score(aim), range),
    series("survivability", "Survivability", survive?.source ?? "sample", score(survive, true), range),
    series("consistency", "Consistency", consistency?.source ?? "sample", score(consistency), range),
    series(
      "first_deaths",
      "First-death control",
      survive?.source ?? "sample",
      score(survive, true),
      range,
    ),
  ];
}
