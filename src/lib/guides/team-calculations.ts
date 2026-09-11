import "server-only";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { resolveCharacterIcon, resolveWeaponIcon } from "@/lib/guides/assets";
import type { GuideCalculations } from "@/lib/guides/team-calculation-types";
import type { Json } from "@/types/database";

function note(details: Json): string | null {
  return details && typeof details === "object" && !Array.isArray(details) && typeof details.note === "string"
    ? details.note : null;
}

export async function getGuideTeamCalculations(characterId: string): Promise<GuideCalculations> {
  const db = createPublicSupabaseClient();
  if (!db) return { teams: [], unavailable: true };
  try {
    const membership = await db.from("team_damage_calculation_members")
      .select("calculation_id").eq("character_id", characterId);
    if (membership.error) throw membership.error;
    const ids = membership.data.map(row => row.calculation_id);
    if (!ids.length) return { teams: [], unavailable: false };
    const [teams, members] = await Promise.all([
      db.from("team_damage_calculations").select("*").eq("game_id", "genshin-impact")
        .in("id", ids).order("team_dps", { ascending: false, nullsFirst: false }).order("id"),
      db.from("team_damage_calculation_members").select("*").in("calculation_id", ids).order("slot"),
    ]);
    if (teams.error) throw teams.error;
    if (members.error) throw members.error;
    const characters = await db.from("game_characters").select("id,slug,display_name,portrait_url")
      .eq("game_id", "genshin-impact").in("id", [...new Set(members.data.map(row => row.character_id))]);
    if (characters.error) throw characters.error;
    const equipmentIds = [...new Set(members.data.flatMap(row => row.equipment_id ? [row.equipment_id] : []))];
    const equipment = equipmentIds.length ? await db.from("game_equipment")
      .select("id,name,icon_url").eq("game_id", "genshin-impact").eq("equipment_category", "weapon").in("id", equipmentIds)
      : { data: [], error: null };
    if (equipment.error) throw equipment.error;
    return {
      unavailable: false,
      teams: teams.data.map(team => ({
        ...team, note: note(team.details),
        members: members.data.filter(member => member.calculation_id === team.id).map(member => {
          const character = characters.data.find(row => row.id === member.character_id);
          if (!character) throw new Error(`Missing calculation character: ${member.character_id}`);
          const weaponName = (member.weapon_name ?? "").replace(/^Weapon:\s*/i, "").replace(/\bR\d+\b/gi, "").trim();
          const weapon = equipment.data.find(row => row.id === member.equipment_id);
          return {
            ...member,
            weapon_name: weapon?.name ?? member.weapon_name,
            characterSlug: character.slug,
            portraitPath: character.portrait_url ?? resolveCharacterIcon("genshin-impact", character.slug, character.display_name).path ?? "",
            weaponPath: weapon?.icon_url ?? resolveWeaponIcon("genshin-impact", weapon?.name ?? weaponName).path ?? "",
            note: note(member.details),
          };
        }),
      })),
    };
  } catch (error) {
    console.error("Unable to load character team calculations", error);
    return { teams: [], unavailable: true };
  }
}
