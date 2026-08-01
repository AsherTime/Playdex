import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

export async function getServerFollowedGameSlugs(): Promise<string[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("user_followed_games")
      .select("game_slug")
      .eq("user_id", user.id);

    if (error || !data) return [];
    return data.map((row) => row.game_slug);
  } catch {
    return [];
  }
}

export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
