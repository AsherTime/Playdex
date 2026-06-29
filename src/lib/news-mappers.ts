import type { Database } from "@/types/database";
import type { GameNews, GamePost } from "@/types/gamedex";

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

export function mapNewsItemToGameNews(row: NewsItemRow, gameById: Map<string, GameRow>): GameNews {
  return {
    id: row.id,
    title: row.title,
    source: row.source_name,
    gameTag: fallbackGameTag(row, gameById),
    summary: row.summary,
    date: row.published_at,
    category: toNewsCategory(row.category),
    gameId: row.game_id ?? undefined,
    url: row.url,
    imageUrl: row.image_url ?? undefined,
    sourceType: row.source_type,
    tags: row.tags,
  };
}

export function mapNewsItemToGamePost(row: NewsItemRow, gameById: Map<string, GameRow>): GamePost {
  const publishedAt = new Date(row.published_at).getTime();
  const diffMinutes = Math.max(1, Math.round((Date.now() - publishedAt) / 60000));
  const timeAgo =
    diffMinutes < 60 ? `${diffMinutes}m ago` : diffMinutes < 1440 ? `${Math.round(diffMinutes / 60)}h ago` : `${Math.round(diffMinutes / 1440)}d ago`;

  return {
    id: row.id,
    source: row.source_name,
    timeAgo,
    title: row.title,
    summary: row.summary,
    gameTag: fallbackGameTag(row, gameById),
    category: toNewsCategory(row.category),
    thumbnailTone: "from-cyan-500/30 to-indigo-500/15",
    gameId: row.game_id ?? undefined,
    url: row.url,
  };
}
