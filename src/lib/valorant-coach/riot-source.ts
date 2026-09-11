import type { MatchReviewCard, PlayerMetrics } from "@/lib/valorant-coach/types";

/**
 * Future Riot integration boundary.
 * Do not call Tracker.gg or collect Riot credentials here.
 * Replace these stubs after RSO + production Valorant API access is granted.
 */
export function isRiotAccountConnected(): boolean {
  return false;
}

export async function fetchRiotPlayerMetrics(): Promise<PlayerMetrics | null> {
  return null;
}

export async function fetchRiotRecentMatches(): Promise<MatchReviewCard[] | null> {
  return null;
}
