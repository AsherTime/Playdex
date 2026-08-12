import { FOLLOWABLE_GAMES } from "@/data/followable-games";
import { formatPlaytimeSeconds, localDateString } from "@/lib/game-usage/format";
import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

export type GamingUsageAggregate = {
  gameSlug: string;
  gameName: string;
  totalPlaytimeSeconds: number;
  formattedPlaytime: string;
  lastPlayedAt: string | null;
  activeDays: number;
  sharePercent: number;
};

export type GamingDashboardStats = {
  todayTotalSeconds: number;
  weekTotalSeconds: number;
  monthTotalSeconds: number;
  gamesPlayedThisWeek: number;
  activeDaysThisWeek: number;
  mostPlayedGame: GamingUsageAggregate | null;
  weekGames: GamingUsageAggregate[];
};

function gameTitle(slug: string): string {
  return FOLLOWABLE_GAMES.find((g) => g.slug === slug)?.title ?? slug;
}

function mapAggregates(
  rows: Array<{
    game_slug: string;
    total_playtime_seconds: number | string;
    last_played_at: string | null;
    active_days: number | string;
  }>,
  totalSeconds: number,
): GamingUsageAggregate[] {
  return rows.map((row) => {
    const seconds = Number(row.total_playtime_seconds);
    return {
      gameSlug: row.game_slug,
      gameName: gameTitle(row.game_slug),
      totalPlaytimeSeconds: seconds,
      formattedPlaytime: formatPlaytimeSeconds(seconds),
      lastPlayedAt: row.last_played_at,
      activeDays: Number(row.active_days),
      sharePercent:
        totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
    };
  });
}

export async function getServerGamingDashboardStats(
  userId: string,
): Promise<GamingDashboardStats | null> {
  const supabase = await createServerSupabaseClient();

  const todayDate = localDateString();

  const [{ data: todayRows }, { data: weekAgg }, { data: weekTotals }, { data: monthTotals }] =
    await Promise.all([
      supabase
        .from("user_game_usage_daily")
        .select("playtime_seconds, game_slug")
        .eq("user_id", userId)
        .eq("usage_date", todayDate),
      supabase.rpc("get_gaming_usage_aggregates", {
        p_user_id: userId,
        p_days: 7,
      }),
      supabase.rpc("get_gaming_usage_totals", {
        p_user_id: userId,
        p_days: 7,
      }),
      supabase.rpc("get_gaming_usage_totals", {
        p_user_id: userId,
        p_days: 30,
      }),
    ]);

  const todayTotalSeconds = (todayRows ?? []).reduce(
    (sum, row) => sum + row.playtime_seconds,
    0,
  );

  const weekTotalSeconds = Number(weekTotals?.[0]?.total_playtime_seconds ?? 0);
  const monthTotalSeconds = Number(monthTotals?.[0]?.total_playtime_seconds ?? 0);
  const gamesPlayedThisWeek = Number(weekTotals?.[0]?.games_played ?? 0);
  const activeDaysThisWeek = Number(weekTotals?.[0]?.active_days ?? 0);

  const weekGames = mapAggregates(weekAgg ?? [], weekTotalSeconds);

  return {
    todayTotalSeconds,
    weekTotalSeconds,
    monthTotalSeconds,
    gamesPlayedThisWeek,
    activeDaysThisWeek,
    mostPlayedGame: weekGames[0] ?? null,
    weekGames,
  };
}

export async function getServerGamingHistory(userId: string, days = 90) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc("get_gaming_usage_aggregates", {
    p_user_id: userId,
    p_days: days,
  });
  const total = (data ?? []).reduce(
    (sum, row) => sum + Number(row.total_playtime_seconds),
    0,
  );
  return mapAggregates(data ?? [], total);
}
