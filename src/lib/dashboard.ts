import { games, metrics, news, sources as mockSources } from "@/data/mock-data";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { GameSource } from "@/types/gamedex";

function mapSource(source: {
  id: string;
  game_id: string | null;
  name: string;
  source_type: "rss" | "website" | "steam";
  url: string | null;
  status: string;
  last_collected_at: string | null;
  cadence: string;
  last_error: string | null;
}): GameSource {
  return {
    id: source.id,
    gameId: source.game_id ?? undefined,
    name: source.name,
    sourceType: source.source_type,
    url: source.url,
    status: source.status === "Healthy" || source.status === "Delayed" || source.status === "Offline" ? source.status : "Delayed",
    lastCollectedAt: source.last_collected_at ?? new Date(0).toISOString(),
    cadence: source.cadence,
    lastError: source.last_error,
  };
}

export async function getDashboardSummary() {
  const latestMetricDate = [...metrics].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  const fallback = {
    totalGamesTracked: games.length,
    totalNewsItems: news.length,
    latestMetricDate,
    latestCollectedMetrics: metrics.filter((metric) => metric.date === latestMetricDate).length,
    sources: mockSources,
  };

  const supabase = createPublicSupabaseClient();
  if (!supabase) return fallback;

  const [gameCount, newsCount, liveSources] = await Promise.all([
    supabase.from("games").select("id", { count: "exact", head: true }),
    supabase.from("news_items").select("id", { count: "exact", head: true }),
    supabase
      .from("game_sources")
      .select("id, game_id, name, source_type, url, status, last_collected_at, cadence, last_error")
      .order("name", { ascending: true }),
  ]);

  if (gameCount.error || newsCount.error || liveSources.error) {
    return fallback;
  }

  return {
    ...fallback,
    totalGamesTracked: gameCount.count ?? fallback.totalGamesTracked,
    totalNewsItems: newsCount.count ?? fallback.totalNewsItems,
    sources: liveSources.data?.length ? liveSources.data.map(mapSource) : fallback.sources,
  };
}
