import "server-only";
import { resolveCharacterIcon, resolveWeaponIcon } from "@/lib/guides/assets";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { GuideTeamCalculation } from "@/lib/guides/team-calculation-types";
import type { Json } from "@/types/database";
import type { WuwaGuide, WuwaRecommendation, WuwaTeam } from "./build-comparison-types";

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
  const [abilityResult, comparisonResult, buildResult, teams] = await Promise.all([
    db.from("character_abilities").select("id,ability_type,name,description,icon_url,sort_order").eq("character_id", character.id).order("sort_order"),
    db.from("character_build_comparisons").select("*").eq("character_id", character.id).eq("status", "completed").order("id"),
    db.from("character_builds").select("id,rotation_playstyle").eq("character_id", character.id),
    getWuwaTeams(db, character.id),
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
    writtenNotes: builds.flatMap(b => b.rotation_playstyle ? [b.rotation_playstyle] : []), teams };
}

function note(details: Json): string | null {
  return details && typeof details === "object" && !Array.isArray(details) && typeof details.note === "string"
    ? details.note : null;
}

function memberKey(ids: Array<string | null | undefined>) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))].sort().join("|");
}

async function getWuwaTeams(
  db: NonNullable<ReturnType<typeof createPublicSupabaseClient>>,
  characterId: string,
): Promise<WuwaTeam[]> {
  try {
    return await loadWuwaTeams(db, characterId);
  } catch (error) {
    console.error("Unable to load Wuthering Waves teams", error);
    return [];
  }
}

async function loadWuwaTeams(
  db: NonNullable<ReturnType<typeof createPublicSupabaseClient>>,
  characterId: string,
): Promise<WuwaTeam[]> {
  const [compMembership, calcMembership] = await Promise.all([
    db.from("character_team_members").select("team_id").eq("character_id", characterId),
    db.from("team_damage_calculation_members").select("calculation_id").eq("character_id", characterId),
  ]);
  if (compMembership.error) throw compMembership.error;
  if (calcMembership.error) throw calcMembership.error;

  const teamIds = [...new Set(compMembership.data.map((row) => row.team_id))];
  const calcIds = [...new Set(calcMembership.data.map((row) => row.calculation_id))];

  const [comps, compMembers, calcRows, calcMembers] = await Promise.all([
    teamIds.length
      ? db.from("character_team_comps").select("id,team_name,team_type,description,rank_order").in("id", teamIds).order("rank_order")
      : Promise.resolve({ data: [], error: null }),
    teamIds.length
      ? db.from("character_team_members").select("team_id,slot_number,character_id,character_name,role").in("team_id", teamIds).order("slot_number")
      : Promise.resolve({ data: [], error: null }),
    calcIds.length
      ? db.from("team_damage_calculations").select("*").eq("game_id", GAME).in("id", calcIds)
        .order("dpr", { ascending: false, nullsFirst: false }).order("id")
      : Promise.resolve({ data: [], error: null }),
    calcIds.length
      ? db.from("team_damage_calculation_members").select("*").in("calculation_id", calcIds).order("slot")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (comps.error) throw comps.error;
  if (compMembers.error) throw compMembers.error;
  if (calcRows.error) throw calcRows.error;
  if (calcMembers.error) throw calcMembers.error;

  const rosterIds = [...new Set([
    ...compMembers.data.flatMap((row) => row.character_id ? [row.character_id] : []),
    ...calcMembers.data.map((row) => row.character_id),
  ])];
  const roster = rosterIds.length
    ? checked(await db.from("game_characters").select("id,slug,display_name,portrait_url").eq("game_id", GAME).in("id", rosterIds))
    : [];
  const equipmentIds = [...new Set(calcMembers.data.flatMap((row) => row.equipment_id ? [row.equipment_id] : []))];
  const equipment = equipmentIds.length
    ? checked(await db.from("game_equipment").select("id,name,icon_url").eq("game_id", GAME).eq("equipment_category", "weapon").in("id", equipmentIds))
    : [];

  const portrait = (id: string | null, name: string) => {
    const character = id ? roster.find((row) => row.id === id) : roster.find((row) => row.display_name === name);
    return character?.portrait_url ?? resolveCharacterIcon(GAME, character?.slug ?? name, character?.display_name ?? name).path;
  };

  const calculations: GuideTeamCalculation[] = calcRows.data.map((team) => ({
    ...team,
    note: note(team.details),
    members: calcMembers.data.filter((member) => member.calculation_id === team.id).map((member) => {
      const character = roster.find((row) => row.id === member.character_id);
      const weaponName = (member.weapon_name ?? "").replace(/^Weapon:\s*/i, "").replace(/\bR\d+\b/gi, "").trim();
      const weapon = equipment.find((row) => row.id === member.equipment_id);
      return {
        ...member,
        weapon_name: weapon?.name ?? member.weapon_name,
        characterSlug: character?.slug ?? "",
        portraitPath: character?.portrait_url ?? resolveCharacterIcon(GAME, character?.slug ?? "", character?.display_name ?? member.character_name).path ?? "",
        weaponPath: weapon?.icon_url ?? resolveWeaponIcon(GAME, weapon?.name ?? weaponName).path ?? "",
        note: note(member.details),
      };
    }),
  }));

  const calcByMembers = new Map<string, GuideTeamCalculation>();
  for (const calculation of calculations) {
    const key = memberKey(calculation.members.map((member) => member.character_id));
    if (key && !calcByMembers.has(key)) calcByMembers.set(key, calculation);
  }

  const usedCalcIds = new Set<string>();
  const suggestionTeams: WuwaTeam[] = comps.data.map((team) => {
    const members = compMembers.data.filter((member) => member.team_id === team.id);
    const calculation = calcByMembers.get(memberKey(members.map((member) => member.character_id))) ?? null;
    if (calculation) usedCalcIds.add(calculation.id);
    return {
      id: team.id,
      name: team.team_name || members.map((member) => member.character_name).filter(Boolean).join(", ") || "Team",
      type: team.team_type,
      description: team.description,
      members: members.map((member) => ({
        characterId: member.character_id,
        name: member.character_name,
        role: member.role,
        portraitUrl: portrait(member.character_id, member.character_name),
      })),
      calculation,
    };
  });

  const calculationTeams: WuwaTeam[] = calculations
    .filter((calculation) => !usedCalcIds.has(calculation.id))
    .map((calculation) => ({
      id: calculation.id,
      name: calculation.team_name,
      type: calculation.members.map((member) => member.role).filter(Boolean).join(" / ") || null,
      description: calculation.note,
      members: calculation.members.map((member) => ({
        characterId: member.character_id,
        name: member.character_name,
        role: member.role,
        portraitUrl: member.portraitPath || portrait(member.character_id, member.character_name),
      })),
      calculation,
    }));

  return [...suggestionTeams, ...calculationTeams];
}
