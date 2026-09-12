import "server-only";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { WuwaGuide, WuwaRecommendation } from "./build-comparison-types";

const GAME = "wuthering-waves";
function checked<T>({ data, error }: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error("Guide data unavailable");
  return data;
}
export async function getWuwaCharacters() {
  const db = createPublicSupabaseClient();
  if (!db) return [];
  return checked(await db.from("game_characters").select("id,slug,display_name,element,weapon_type,rarity,portrait_url")
    .eq("game_id", GAME).eq("is_playable", true).order("display_name"));
}
export async function getWuwaCharacter(slug: string): Promise<WuwaGuide | null> {
  const db = createPublicSupabaseClient();
  if (!db) return null;
  const result = await db.from("game_characters").select("id,slug,name,element,weapon_type,rarity,portrait_url,metadata")
    .eq("game_id", GAME).eq("slug", slug).maybeSingle();
  if (result.error) throw result.error;
  const character = result.data;
  if (!character) return null;
  const [abilityResult, comparisonResult, buildResult] = await Promise.all([
    db.from("character_abilities").select("id,ability_type,name,description,icon_url").eq("character_id", character.id).order("sort_order"),
    db.from("character_build_comparisons").select("*").eq("character_id", character.id).eq("status", "completed").order("id"),
    db.from("character_builds").select("id,rotation_playstyle").eq("character_id", character.id),
  ]);
  const abilities = checked(abilityResult), comparisons = checked(comparisonResult), builds = checked(buildResult);
  const entries = comparisons.length ? checked(await db.from("character_build_comparison_entries").select("*")
    .in("comparison_id", comparisons.map(c => c.id)).order("sort_order")) : [];
  const metadata = character.metadata && typeof character.metadata === "object" && !Array.isArray(character.metadata) ? character.metadata : {};
  const recommendedIds = Array.isArray(metadata.recommended_weapon_source_ids) ? metadata.recommended_weapon_source_ids.map(String) : [];
  let weapons: WuwaRecommendation[] = recommendedIds.length ? checked(await db.from("game_equipment").select("id,name,icon_url,source_id")
    .eq("game_id", GAME).eq("source_site", "nanoka").eq("equipment_category", "weapon").in("source_id", recommendedIds))
    .sort((a,b) => recommendedIds.indexOf(a.source_id) - recommendedIds.indexOf(b.source_id)) : [];
  let sets: WuwaRecommendation[] = [];
  if (builds.length) {
    const buildIds = builds.map(b => b.id);
    const [weaponResult, setResult] = await Promise.all([
      db.from("character_build_equipment_recommendations").select("equipment_id,recommendation_text,rank_order").in("build_id", buildIds).order("rank_order"),
      db.from("character_build_set_recommendations").select("set_id,recommendation_text,pieces,rank_order").in("build_id", buildIds).order("rank_order"),
    ]);
    const weaponRecs = checked(weaponResult), setRecs = checked(setResult);
    if (weaponRecs.length) {
      const canonical = checked(await db.from("game_equipment").select("id,name,icon_url").eq("game_id", GAME).in("id", weaponRecs.map(r => r.equipment_id)));
      weapons = weaponRecs.flatMap(r => { const w = canonical.find(w => w.id === r.equipment_id); return w ? [{ ...w, note: r.recommendation_text }] : []; });
    }
    if (setRecs.length) {
      const canonical = checked(await db.from("game_equipment_sets").select("id,name,icon_url").eq("game_id", GAME).in("id", setRecs.map(r => r.set_id)));
      sets = setRecs.flatMap(r => { const s = canonical.find(s => s.id === r.set_id); return s ? [{ ...s, note: r.recommendation_text, pieces: r.pieces }] : []; });
    }
  }
  return { ...character, abilities, comparisons: comparisons.map(c => ({ ...c, entries: entries.filter(e => e.comparison_id === c.id) })), weapons, sets,
    writtenNotes: builds.flatMap(b => b.rotation_playstyle ? [b.rotation_playstyle] : []) };
}
