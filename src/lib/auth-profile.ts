import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

export async function upsertOwnProfile(input: {
  name: string;
  age: number | null;
  email?: string;
}) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: input.email ?? user.email ?? "",
        name: input.name,
        age: input.age,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
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
