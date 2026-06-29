import { esportsEvents, posts, recentlyViewedGames, streamers, youtubers } from "@/data/mock-data";
import { mapNewsItemToGamePost } from "@/lib/news-mappers";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";
import type { GamePost } from "@/types/gamedex";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

function gameMap(rows: GameRow[]) {
  return new Map(rows.map((game) => [game.id, game]));
}

async function getLiveFeedPosts(limit: number): Promise<GamePost[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const [{ data: games }, { data: newsItems, error }] = await Promise.all([
    supabase.from("games").select("*"),
    supabase.from("news_items").select("*").order("published_at", { ascending: false }).limit(limit),
  ]);

  if (error || !newsItems?.length) return [];

  return newsItems.map((item) => mapNewsItemToGamePost(item, gameMap(games ?? [])));
}

export async function getFeaturedPosts() {
  const livePosts = await getLiveFeedPosts(4);
  return livePosts.length ? livePosts : posts.slice(0, 4);
}

export async function getFeedPosts() {
  const livePosts = await getLiveFeedPosts(24);
  return livePosts.length ? livePosts : posts;
}

export function getCommunityPosts() {
  return posts.filter((post) => post.category === "Community");
}

export function getTopStreamers() {
  return streamers;
}

export function getTopYouTubers() {
  return youtubers;
}

export function getUpcomingEsportsEvents() {
  return esportsEvents;
}

export function getRecentlyViewedGames() {
  return recentlyViewedGames;
}
