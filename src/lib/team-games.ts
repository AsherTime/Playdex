import type { CalcGameId } from "@/types/teams";

export const CALC_GAME_IDS = ["genshin-impact", "wuthering-waves"] as const;

export function isCalcGame(slugOrId: string): slugOrId is CalcGameId {
  return CALC_GAME_IDS.includes(slugOrId as CalcGameId);
}

export function getCalcGameTitle(gameId: CalcGameId) {
  return gameId === "genshin-impact" ? "Genshin Impact" : "Wuthering Waves";
}
