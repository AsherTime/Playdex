import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

export type ImprovementSnapshot = {
  gameSlug: string;
  gameName: string;
  focusAreas: string[];
  activeDay: number;
  completedTasks: number;
  totalTasks: number;
  todayTasks: string[];
};

export type PublicGamingProfile = {
  private: boolean;
  isOwner?: boolean;
  id?: string;
  username?: string;
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  joinedAt?: string;
  mainGameSlug?: string | null;
  profileVisibility?: "public" | "private";
  privacy?: {
    showPlaytime: boolean;
    showWeeklyPlaytime: boolean;
    showRecentGames: boolean;
    showImprovementPlan: boolean;
    showFavoriteGames: boolean;
    showStreak: boolean;
    showPlatform: boolean;
  };
  stats?: {
    weekTotalSeconds: number | null;
    monthTotalSeconds: number | null;
    weekGamesPlayed: number | null;
    activeDays: number | null;
  } | null;
  recentGames?: Array<{
    gameSlug: string;
    totalPlaytimeSeconds: number;
    lastPlayedAt: string | null;
    activeDays: number;
  }>;
  favoriteGames?: string[];
  improvement?: ImprovementSnapshot | null;
};

export async function fetchPublicGamingProfile(
  username: string,
): Promise<PublicGamingProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_public_gaming_profile", {
    p_username: username,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return data as PublicGamingProfile;
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
