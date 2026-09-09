import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ImprovementSnapshot } from "@/lib/public-profile";
import { normalizeUsername, validateUsername } from "@/lib/username";
import type { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileUpdateInput = {
  name: string;
  age: number | null;
  email?: string;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  profileVisibility?: "public" | "private";
  showPlaytime?: boolean;
  showWeeklyPlaytime?: boolean;
  showRecentGames?: boolean;
  showImprovementPlan?: boolean;
  showFavoriteGames?: boolean;
  showStreak?: boolean;
  showPlatform?: boolean;
  mainGameSlug?: string | null;
  improvementSnapshot?: ImprovementSnapshot | null;
};

export async function getOwnProfile() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertOwnProfile(input: ProfileUpdateInput) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (input.username) {
    const usernameError = validateUsername(input.username);
    if (usernameError) {
      throw new Error(usernameError);
    }
  }

  const insertPayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    email: input.email ?? user.email ?? "",
    name: input.name,
    age: input.age,
  };
  const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
    name: input.name,
    age: input.age,
  };

  if (input.username !== undefined) {
    const username = input.username ? normalizeUsername(input.username) : null;
    insertPayload.username = username;
    updatePayload.username = username;
  }
  if (input.bio !== undefined) {
    insertPayload.bio = input.bio;
    updatePayload.bio = input.bio;
  }
  if (input.avatarUrl !== undefined) {
    insertPayload.avatar_url = input.avatarUrl;
    updatePayload.avatar_url = input.avatarUrl;
  }
  if (input.profileVisibility !== undefined) {
    insertPayload.profile_visibility = input.profileVisibility;
    updatePayload.profile_visibility = input.profileVisibility;
  }
  if (input.showPlaytime !== undefined) {
    insertPayload.show_playtime = input.showPlaytime;
    updatePayload.show_playtime = input.showPlaytime;
  }
  if (input.showWeeklyPlaytime !== undefined) {
    insertPayload.show_weekly_playtime = input.showWeeklyPlaytime;
    updatePayload.show_weekly_playtime = input.showWeeklyPlaytime;
  }
  if (input.showRecentGames !== undefined) {
    insertPayload.show_recent_games = input.showRecentGames;
    updatePayload.show_recent_games = input.showRecentGames;
  }
  if (input.showImprovementPlan !== undefined) {
    insertPayload.show_improvement_plan = input.showImprovementPlan;
    updatePayload.show_improvement_plan = input.showImprovementPlan;
  }
  if (input.showFavoriteGames !== undefined) {
    insertPayload.show_favorite_games = input.showFavoriteGames;
    updatePayload.show_favorite_games = input.showFavoriteGames;
  }
  if (input.showStreak !== undefined) {
    insertPayload.show_streak = input.showStreak;
    updatePayload.show_streak = input.showStreak;
  }
  if (input.showPlatform !== undefined) {
    insertPayload.show_platform = input.showPlatform;
    updatePayload.show_platform = input.showPlatform;
  }
  if (input.mainGameSlug !== undefined) {
    insertPayload.main_game_slug = input.mainGameSlug;
    updatePayload.main_game_slug = input.mainGameSlug;
  }
  if (input.improvementSnapshot !== undefined) {
    insertPayload.improvement_snapshot = input.improvementSnapshot;
    updatePayload.improvement_snapshot = input.improvementSnapshot;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") {
      throw new Error("That username is already taken.");
    }
    throw updateError;
  }
  if (updated) return updated;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retried, error: retryError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id)
        .select("*")
        .single();

      if (retryError) {
        if (retryError.code === "23505") throw new Error("That username is already taken.");
        throw retryError;
      }
      return retried;
    }
    throw insertError;
  }
  return inserted;
}

export async function getFollowedGameSlugs(): Promise<string[]> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_followed_games")
    .select("game_slug")
    .eq("user_id", user.id);

  if (error) throw error;
  return (data ?? []).map((row) => row.game_slug);
}

export async function setFollowedGames(gameSlugs: string[]) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error: deleteError } = await supabase
    .from("user_followed_games")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) throw deleteError;

  if (!gameSlugs.length) return;

  const { error: insertError } = await supabase.from("user_followed_games").insert(
    gameSlugs.map((game_slug) => ({
      user_id: user.id,
      game_slug,
    })),
  );

  if (insertError) throw insertError;
}

export async function isProfileSetupComplete(): Promise<boolean> {
  const profile = await getOwnProfile();
  if (!profile?.name?.trim()) return false;
  const followed = await getFollowedGameSlugs();
  return followed.length > 0;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const validationError = validateUsername(normalized);
  if (validationError) return false;

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  if (error) throw error;
  return !data;
}
