import "server-only";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { resolveCharacterIcon } from "@/lib/guides/assets";
import type { TierListData } from "./types";

export async function getTierList(gameId: string): Promise<TierListData | null> {
  const db = createPublicSupabaseClient();
  if (!db) throw new Error("Tier list is temporarily unavailable.");
  const { data: list, error } = await db.from("game_character_tier_lists")
    .select("*").eq("game_id", gameId).eq("slug", "main").maybeSingle();
  if (error) throw new Error("Could not load tier list.");
  if (!list) return null;
  const [entries, characters] = await Promise.all([
    db.from("game_character_tier_entries").select("character_id,role,tier,sort_order,notes")
      .eq("tier_list_id", list.id).order("sort_order").limit(3000),
    db.from("game_characters").select("id,slug,display_name,element,portrait_url")
      .eq("game_id", gameId).order("display_name"),
  ]);
  if (entries.error || characters.error) throw new Error("Could not load tier list characters.");
  return { list, entries: entries.data, characters: characters.data.map(character => ({
    id: character.id, slug: character.slug, name: character.display_name, element: character.element,
    icon: resolveCharacterIcon(gameId, character.slug, character.display_name).path ?? character.portrait_url,
  })) };
}
