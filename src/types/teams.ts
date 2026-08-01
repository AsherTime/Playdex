export type CalcGameId = "genshin-impact" | "wuthering-waves";

export interface CharacterSummary {
  id: string;
  slug: string;
  gameId: CalcGameId;
  name: string;
  element: string;
  role: string;
  summary: string;
  portraitPath: string;
}
