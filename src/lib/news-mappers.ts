import type { Database } from "@/types/database";
import type { GameNews, GamePost } from "@/types/gamedex";
import { formatRelativeTime } from "@/utils/formatters";
import { normalizeNewsSummary, normalizeNewsTitle } from "@/utils/news-normalize";

type NewsItemRow = Database["public"]["Tables"]["news_items"]["Row"];
type GameRow = Database["public"]["Tables"]["games"]["Row"];

const allowedCategories = new Set(["Update", "Esports", "Release", "Rumor", "Community"]);

function toNewsCategory(category: string): GameNews["category"] {
  return allowedCategories.has(category) ? (category as GameNews["category"]) : "Update";
}

function fallbackGameTag(row: NewsItemRow, gameById: Map<string, GameRow>) {
  if (!row.game_id) return "General";
  return gameById.get(row.game_id)?.title ?? row.game_id;
}

function normalizeRow(row: NewsItemRow) {
  const title = normalizeNewsTitle(row.title);
  const summary = normalizeNewsSummary(row.summary, title, row.title);

  return { title, summary };
}

export function mapNewsItemToGameNews(row: NewsItemRow, gameById: Map<string, GameRow>): GameNews {
  const { title, summary } = normalizeRow(row);
  const gameId = row.game_id ?? undefined;

  return {
    id: row.id,
    title,
    source: row.source_name,
    gameTag: fallbackGameTag(row, gameById),
    summary,
    date: row.published_at,
    category: toNewsCategory(row.category),
    gameId,
    url: row.url,
    imageUrl: row.image_url ?? undefined,
    sourceType: row.source_type,
    tags: row.tags,
  };
}

export function mapNewsItemToGamePost(row: NewsItemRow, gameById: Map<string, GameRow>): GamePost {
  const { title, summary } = normalizeRow(row);

  return {
    id: row.id,
    source: row.source_name,
    timeAgo: formatRelativeTime(row.published_at),
    title,
    summary,
    gameTag: fallbackGameTag(row, gameById),
    category: toNewsCategory(row.category),
    thumbnailTone: "from-cyan-500/30 to-indigo-500/15",
    gameId: row.game_id ?? undefined,
    url: row.url,
  };
}
