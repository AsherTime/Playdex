import { games, news as mockNews } from "@/data/mock-data";
import { mapNewsItemToGameNews } from "@/lib/news-mappers";
import { prepareFeedRows } from "@/lib/news-feed";
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

export async function getTrackedGames() {
  const rows = await getGameRows();
  return rows.map((game) => ({ id: game.id, slug: game.slug, title: game.title }));
}

export async function getLatestNews(
  limit = 24,
  gameIdOrSlug?: string,
  preferredGameSlugs: string[] = [],
): Promise<GameNews[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return prioritizeByFollowedGames(
      mockNewsForGame(gameIdOrSlug).slice(0, limit),
      preferredGameSlugs,
    );
  }

  const gameRows = await getGameRows();
  const gamesById = gameMap(gameRows);
  const gameFilter = gameIdOrSlug
    ? gameRows.find((item) => item.id === gameIdOrSlug || item.slug === gameIdOrSlug)
    : undefined;

  if (gameIdOrSlug && !gameFilter) {
    return prioritizeByFollowedGames(
      mockNewsForGame(gameIdOrSlug).slice(0, limit),
      preferredGameSlugs,
    );
  }

  let query = supabase.from("news_items").select("*").order("published_at", { ascending: false });

  if (gameFilter) {
    query = query.eq("game_id", gameFilter.id).limit(limit * 2);
  } else {
    query = query.limit(Math.max(limit * 8, 200));
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return prioritizeByFollowedGames(
      mockNewsForGame(gameIdOrSlug).slice(0, limit),
      preferredGameSlugs,
    );
  }

  const ranked = prepareFeedRows(data, limit, { balanced: !gameFilter });
  const mapped = ranked.map((row) => mapNewsItemToGameNews(row, gamesById));
  return prioritizeByFollowedGames(mapped, preferredGameSlugs);
}

function prioritizeByFollowedGames(items: GameNews[], preferredGameSlugs: string[]) {
  if (!preferredGameSlugs.length) return items;

  const preferred = new Set(preferredGameSlugs);
  const followed: GameNews[] = [];
  const other: GameNews[] = [];

  for (const item of items) {
    const slug =
      games.find((game) => game.id === item.gameId || game.slug === item.gameId)?.slug ??
      item.gameId ??
      "";
    if ((slug && preferred.has(slug)) || (item.gameId && preferred.has(item.gameId))) {
      followed.push(item);
    } else {
      other.push(item);
    }
  }

  return [...followed, ...other];
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
    .limit(limit * 2);

  if (error || !data?.length) {
    return mockNewsForGame(game.id).slice(0, limit);
  }

  const ranked = prepareFeedRows(data, limit, { balanced: false });
  return ranked.map((row) => mapNewsItemToGameNews(row, gameMap(gameRows)));
}
