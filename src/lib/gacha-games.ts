export const GACHA_GAME_IDS = [
  "genshin-impact",
  "wuthering-waves",
] as const;

export type GachaGameId = (typeof GACHA_GAME_IDS)[number];

export function isGachaGame(gameId: string | null | undefined) {
  return Boolean(gameId && GACHA_GAME_IDS.includes(gameId as GachaGameId));
}
