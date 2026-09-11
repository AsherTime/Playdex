import type { AnalysisInsight, TrainingRecommendation } from "@/lib/valorant-coach/types";

const RULES: Array<{
  metricKey: string;
  ratings: Array<AnalysisInsight["rating"]>;
  build: (insight: AnalysisInsight, minutes: number) => TrainingRecommendation;
}> = [
  {
    metricKey: "headshot_pct",
    ratings: ["weak", "needs_work"],
    build: (insight, minutes) => ({
      problemKey: insight.metricKey,
      diagnosis: "Low first-bullet / headshot accuracy",
      title: "Crosshair placement · first-bullet precision",
      duration: minutes <= 20 ? "8 min" : "10 min",
      reason: "Guardian or range first-bullet reps, then transfer the same height into Deathmatch.",
      kind: "drill",
      priority: insight.priority,
    }),
  },
  {
    metricKey: "first_death_rate",
    ratings: ["weak", "needs_work"],
    build: (insight) => ({
      problemKey: insight.metricKey,
      diagnosis: "High first-death rate",
      title: "Reduce unnecessary first engagements",
      duration: "During ranked",
      reason: "Play for information, not opening kills. If you die first, write why before the next pistol.",
      kind: "ranked",
      priority: insight.priority,
    }),
  },
  {
    metricKey: "consistency",
    ratings: ["weak", "needs_work"],
    build: (insight) => ({
      problemKey: insight.metricKey,
      diagnosis: "Mechanics are not the main leak",
      title: "Decision-making review",
      duration: "8 min",
      reason: "Watch two lost rounds and name the decision, not the aim miss.",
      kind: "review",
      priority: insight.priority,
    }),
  },
  {
    metricKey: "kd",
    ratings: ["weak", "needs_work"],
    build: (insight, minutes) => ({
      problemKey: insight.metricKey,
      diagnosis: "Losing too many gunfights",
      title: "Deathmatch with a duel objective",
      duration: minutes <= 20 ? "8 min" : "10 min",
      reason: "Only take isolated 1v1s. Reset if you swing a stacked angle.",
      kind: "deathmatch",
      priority: insight.priority,
    }),
  },
];

function mapRule(insight: AnalysisInsight): TrainingRecommendation | null {
  if (insight.category !== "map") return null;
  if (insight.rating === "strong" || insight.rating === "average") return null;
  return {
    problemKey: insight.metricKey,
    diagnosis: `${insight.label} map leak`,
    title: `${insight.label} positioning review`,
    duration: "8 min",
    reason: `Learn two default spots and one rotate path on ${insight.label}. Sample map data until Riot is connected.`,
    kind: "review",
    priority: insight.priority,
  };
}

export function recommendationsFromInsights(
  insights: AnalysisInsight[],
  practiceMinutes: number,
): TrainingRecommendation[] {
  const recs: TrainingRecommendation[] = [
    {
      problemKey: "warmup",
      diagnosis: "Session start",
      title: "Warm-up",
      duration: practiceMinutes <= 20 ? "6 min" : "8 min",
      reason: "Short range or aim trainer so the first ranked fight is not your warm-up.",
      kind: "warmup",
      priority: 0,
    },
  ];

  for (const insight of insights) {
    const rule = RULES.find(
      (item) => item.metricKey === insight.metricKey && item.ratings.includes(insight.rating),
    );
    if (rule) recs.push(rule.build(insight, practiceMinutes));
    const mapRec = mapRule(insight);
    if (mapRec) recs.push(mapRec);
  }

  recs.push({
    problemKey: "ranked_block",
    diagnosis: "Apply the focus",
    title: practiceMinutes >= 60 ? "Ranked — 2 games" : "Ranked — 1 game",
    duration: practiceMinutes >= 60 ? "2 games" : "1 game",
    reason: "Play with one written focus. Stop adding extra goals mid-match.",
    kind: "ranked",
    priority: 9,
  });

  return recs
    .filter((rec, index, list) => list.findIndex((item) => item.title === rec.title) === index)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, practiceMinutes <= 20 ? 4 : 5);
}

export function todaysFocus(insights: AnalysisInsight[]): string {
  const top = insights.find((insight) => insight.rating === "weak" || insight.rating === "needs_work");
  if (!top) return "Play one clean session and note a single mistake.";
  if (top.metricKey === "first_death_rate") return "Reduce unnecessary first deaths.";
  if (top.metricKey === "headshot_pct") return "Keep the crosshair at head height before you peek.";
  if (top.category === "map") return `Play slower defaults on ${top.label}.`;
  return top.explanation;
}
