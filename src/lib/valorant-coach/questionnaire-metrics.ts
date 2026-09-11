import { VALORANT_AGENTS } from "@/data/valorant-agents";
import { SAMPLE_PLAYER_METRICS } from "@/lib/valorant-coach/sample-data";
import { normalizeGoal } from "@/lib/valorant-coach/practice-time";
import type { PlayerMetrics } from "@/lib/valorant-coach/types";
import type { ImproveQuestionnaire, ValorantWeakness } from "@/types/valorant-improve";

const AIM_WEAK: ValorantWeakness[] = ["Aim", "Flicks", "Tracking", "Spray Control", "Crosshair Placement"];
const SURVIVE_WEAK: ValorantWeakness[] = ["Peeking", "Positioning", "Movement"];
const SENSE_WEAK: ValorantWeakness[] = ["Game Sense", "Economy Management", "Utility Usage"];

function hasAny(items: string[] | undefined, set: string[]) {
  return (items ?? []).some((item) => set.includes(item));
}

function agentNames(ids: string[]) {
  return ids.map((id) => VALORANT_AGENTS.find((agent) => agent.id === id)?.name ?? id);
}

export function metricsFromQuestionnaire(questionnaire: ImproveQuestionnaire | null): PlayerMetrics {
  const weaknesses = questionnaire?.weaknesses ?? [];
  const goal = normalizeGoal(questionnaire?.goal);
  const lost = questionnaire?.lostRoundCause ?? "";

  const aimIssue = hasAny(weaknesses, AIM_WEAK) || goal === "Improve Aim" || lost.includes("aim") || lost.includes("crosshair");
  const firstDeathIssue =
    hasAny(weaknesses, SURVIVE_WEAK) || lost.includes("position") || lost.includes("peek");
  const senseIssue =
    hasAny(weaknesses, SENSE_WEAK) || goal === "Improve Game Sense" || lost.includes("utility") || lost.includes("communication");

  return {
    source: "questionnaire",
    rank: questionnaire?.rank ?? null,
    rankSource: "questionnaire",
    mainAgents: agentNames(questionnaire?.agents ?? []),
    role: questionnaire?.role ?? null,
    headshotPercent: aimIssue ? 16 : SAMPLE_PLAYER_METRICS.headshotPercent,
    firstDeathRate: firstDeathIssue ? 0.34 : SAMPLE_PLAYER_METRICS.firstDeathRate,
    kd: aimIssue && firstDeathIssue ? 0.86 : SAMPLE_PLAYER_METRICS.kd,
    winRate: senseIssue ? 0.43 : SAMPLE_PLAYER_METRICS.winRate,
    acs: senseIssue ? 176 : SAMPLE_PLAYER_METRICS.acs,
    recentForm: SAMPLE_PLAYER_METRICS.recentForm,
    strongestArea: aimIssue ? "Utility / setup" : "Aim fundamentals",
    biggestWeakness: firstDeathIssue
      ? "First deaths / overpeeking"
      : aimIssue
        ? "First-bullet accuracy"
        : senseIssue
          ? "Decision-making"
          : weaknesses[0] ?? "Consistency",
    mapWinRates: SAMPLE_PLAYER_METRICS.mapWinRates,
    attackWinRate: SAMPLE_PLAYER_METRICS.attackWinRate,
    defenseWinRate: SAMPLE_PLAYER_METRICS.defenseWinRate,
    agentRatings: SAMPLE_PLAYER_METRICS.agentRatings,
    vandalAccuracyPercent: aimIssue ? 19 : SAMPLE_PLAYER_METRICS.vandalAccuracyPercent,
    phantomAccuracyPercent: aimIssue ? 22 : SAMPLE_PLAYER_METRICS.phantomAccuracyPercent,
    vandalHsPercent: aimIssue ? 15 : SAMPLE_PLAYER_METRICS.vandalHsPercent,
    phantomHsPercent: aimIssue ? 14 : SAMPLE_PLAYER_METRICS.phantomHsPercent,
    headHitShare: aimIssue ? 0.16 : SAMPLE_PLAYER_METRICS.headHitShare,
    bodyHitShare: aimIssue ? 0.64 : SAMPLE_PLAYER_METRICS.bodyHitShare,
    deathsPerRound: firstDeathIssue ? 0.86 : SAMPLE_PLAYER_METRICS.deathsPerRound,
    firstKillRate: firstDeathIssue ? 0.09 : SAMPLE_PLAYER_METRICS.firstKillRate,
    adr: aimIssue ? 124 : SAMPLE_PLAYER_METRICS.adr,
    openingDuelWinRate: firstDeathIssue ? 0.38 : SAMPLE_PLAYER_METRICS.openingDuelWinRate,
    tradePercent: SAMPLE_PLAYER_METRICS.tradePercent,
    multikillRate: aimIssue ? 0.07 : SAMPLE_PLAYER_METRICS.multikillRate,
    kast: senseIssue ? 0.61 : SAMPLE_PLAYER_METRICS.kast,
  };
}
