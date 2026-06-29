import { games, news as mockNews } from "@/data/mock-data";
import { mapNewsItemToGameNews } from "@/lib/news-mappers";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";
import type { GameNews } from "@/types/gamedex";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

function mockNewsForGame(gameIdOrSlug?: string) {
  if (!gameIdOrSlug) return [...mockNews].sort((a, b) => b.date.localeCompare(a.date));

  const game = games.find((item) => item.id === gameIdOrSlug || item.slug === gameIdOrSlug);
  if (!game) return [];

  const gameNews = mockNews.filter((item) => item.gameId === game.id).sort((a, b) => b.date.localeCompare(a.date));
  if (gameNews.length) return gameNews;

  return game.latestUpdates.map((update, index) => ({
    id: `${game.id}-fallback-news-${index + 1}`,
    title: update,
    source: "Seed Updates",
    gameTag: game.title,
    summary: `${game.title} seed update used until live collector data is available.`,
    date: new Date(Date.now() - index * 86400000).toISOString(),
    category: "Update" as const,
    gameId: game.id,
  }));
}

async function getGameRows() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("games").select("*");
  if (error) return [];

  return data ?? [];
}

function gameMap(rows: GameRow[]) {
  return new Map(rows.map((game) => [game.id, game]));
}

export async function getLatestNews(limit = 24): Promise<GameNews[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return mockNewsForGame().slice(0, limit);

  const gameRows = await getGameRows();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return mockNewsForGame().slice(0, limit);
  }

  return data.map((row) => mapNewsItemToGameNews(row, gameMap(gameRows)));
}

export async function getLatestNewsForGame(gameIdOrSlug: string, limit = 12): Promise<GameNews[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return mockNewsForGame(gameIdOrSlug).slice(0, limit);

  const gameRows = await getGameRows();
  const game = gameRows.find((item) => item.id === gameIdOrSlug || item.slug === gameIdOrSlug);

  if (!game) {
    return mockNewsForGame(gameIdOrSlug).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("game_id", game.id)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return mockNewsForGame(game.id).slice(0, limit);
  }

  return data.map((row) => mapNewsItemToGameNews(row, gameMap(gameRows)));
}
