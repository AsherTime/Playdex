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

  // Production profiles currently only has: id, email, name, age, created_at, updated_at, app_role.
  // Gaming-identity columns were postponed; never PATCH them or clients get PGRST204.
  // Never write app_role, email, id, or timestamps through this form path.
  const insertPayload = {
    id: user.id,
    email: input.email ?? user.email ?? "",
    name: input.name,
    age: input.age,
  };
  const updatePayload = {
    name: input.name,
    age: input.age,
  };

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .select("*")
    .maybeSingle();

  if (updateError) throw updateError;
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

      if (retryError) throw retryError;
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
