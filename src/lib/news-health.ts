import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type NewsCollectorHealth = {
  status: "healthy" | "unhealthy" | "unknown";
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastNewArticleAt: string | null;
  activeSources: number;
  failingSources: Array<{ id: string; name: string; lastError: string | null; consecutiveFailures: number }>;
  articlesLast24h: number;
  homepageEligible: number;
  articlesWithoutImages: number;
  nextExpectedRunAt: string | null;
};

const HEALTHY_AFTER_SUCCESS_HOURS = 3;

function addHours(value: string | null, hours: number) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export async function getNewsCollectorHealth(): Promise<NewsCollectorHealth> {
  const supabase = createPublicSupabaseClient();
  const fallback: NewsCollectorHealth = {
    status: "unknown",
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastNewArticleAt: null,
    activeSources: 0,
    failingSources: [],
    articlesLast24h: 0,
    homepageEligible: 0,
    articlesWithoutImages: 0,
    nextExpectedRunAt: null,
  };

  if (!supabase) return fallback;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    lastSuccess,
    lastAttempt,
    sources,
    recentArticles,
    homepageArticles,
    nullImageArticles,
    emptyImageArticles,
    latestArticle,
  ] = await Promise.all([
      supabase
        .from("collector_runs")
        .select("started_at, finished_at")
        .eq("collector", "news")
        .in("status", ["completed", "partial"])
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("collector_runs")
        .select("started_at, finished_at, status")
        .eq("collector", "news")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("game_sources")
        .select("id, name, enabled, status, last_error, consecutive_failures")
        .eq("enabled", true),
      supabase
        .from("news_items")
        .select("id", { count: "exact", head: true })
        .gte("collected_at", since24h),
      supabase
        .from("news_items")
        .select("id", { count: "exact", head: true })
        .eq("homepage_eligible", true)
        .is("duplicate_of", null),
      supabase
        .from("news_items")
        .select("id", { count: "exact", head: true })
        .is("image_url", null),
      supabase
        .from("news_items")
        .select("id", { count: "exact", head: true })
        .eq("image_url", ""),
      supabase
        .from("news_items")
        .select("published_at")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (lastSuccess.error || lastAttempt.error || sources.error) return fallback;

  const sourceRows = sources.data ?? [];
  const lastSuccessAt = lastSuccess.data?.finished_at ?? lastSuccess.data?.started_at ?? null;
  const lastAttemptAt = lastAttempt.data?.finished_at ?? lastAttempt.data?.started_at ?? null;
  const nextExpectedRunAt = addHours(lastAttemptAt, 1);
  const lastSuccessAgeMs = lastSuccessAt ? Date.now() - new Date(lastSuccessAt).getTime() : Number.POSITIVE_INFINITY;
  const status =
    lastSuccessAt && lastSuccessAgeMs <= HEALTHY_AFTER_SUCCESS_HOURS * 60 * 60 * 1000
      ? "healthy"
      : "unhealthy";

  return {
    status,
    lastSuccessAt,
    lastAttemptAt,
    lastNewArticleAt: latestArticle.data?.published_at ?? null,
    activeSources: sourceRows.length,
    failingSources: sourceRows
      .filter((source) => source.status === "Error" || (source.consecutive_failures ?? 0) > 0)
      .map((source) => ({
        id: source.id,
        name: source.name,
        lastError: source.last_error,
        consecutiveFailures: source.consecutive_failures ?? 0,
      })),
    articlesLast24h: recentArticles.count ?? 0,
    homepageEligible: homepageArticles.count ?? 0,
    articlesWithoutImages: (nullImageArticles.count ?? 0) + (emptyImageArticles.count ?? 0),
    nextExpectedRunAt,
  };
}
