import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { localDateString } from "@/lib/game-usage/format";
import type { NormalizedGameUsage } from "@/lib/game-usage/types";

export type DailyUsageUpsert = {
  usageDate: string;
  gameSlug: string;
  playtimeSeconds: number;
  sessionCount: number;
  lastPlayedAt: string | null;
};

export function buildDailyUpsertsFromToday(
  games: NormalizedGameUsage[],
  usageDate = localDateString(),
): DailyUsageUpsert[] {
  return games
    .filter((game) => game.foregroundMs > 0)
    .map((game) => ({
      usageDate,
      gameSlug: game.gameSlug,
      playtimeSeconds: Math.round(game.foregroundMs / 1000),
      sessionCount: game.sessionCount,
      lastPlayedAt:
        game.lastUsed > 0 ? new Date(game.lastUsed).toISOString() : null,
    }));
}

export async function syncTodayUsageToSupabase(
  userId: string,
  games: NormalizedGameUsage[],
): Promise<void> {
  const rows = buildDailyUpsertsFromToday(games);
  if (rows.length === 0) {
    return;
  }

  const supabase = createBrowserSupabaseClient();
  const payload = rows.map((row) => ({
    user_id: userId,
    usage_date: row.usageDate,
    game_slug: row.gameSlug,
    playtime_seconds: row.playtimeSeconds,
    session_count: row.sessionCount,
    last_played_at: row.lastPlayedAt,
    source: "android" as const,
  }));

  const { error } = await supabase.from("user_game_usage_daily").upsert(payload, {
    onConflict: "user_id,usage_date,game_slug",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchRecentSyncedUsage(userId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceDate = localDateString(since);

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("user_game_usage_daily")
    .select("*")
    .eq("user_id", userId)
    .gte("usage_date", sinceDate)
    .order("usage_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
