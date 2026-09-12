export type NewsSourceTrace = {
  sourceId: string;
  gameId: string | null;
  fetches: number;
  discovered: number;
  parsed: number;
  known: number;
  filtered: number;
  inserted: number;
  parseErrors: string[];
  articles: { url: string; title: string; stage: string; reason?: string }[];
};
