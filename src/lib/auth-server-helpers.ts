import { createServerSupabaseClient } from "@/lib/supabase/auth-server";
import type { Database } from "@/types/database";

export type ServerProfile = Database["public"]["Tables"]["profiles"]["Row"];

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

export async function getServerProfile(): Promise<ServerProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
