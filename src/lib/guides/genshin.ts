import "server-only";

import { createPublicSupabaseClient } from "@/lib/supabase/public";
import {
  resolveArtifactIcon,
  resolveCharacterIcon,
  resolveWeaponIcon,
} from "@/lib/guides/assets";
import type { GuideEquipmentSummary } from "@/lib/guides/equipment-types";
import type { Database, Json } from "@/types/database";

const GAME_ID = "genshin-impact";
const GAME_SLUG = "genshin-impact";

type CharacterRow = {
  id: string;
  slug: string;
  display_name: string;
  element: string | null;
  weapon_type: string | null;
  rarity: number | null;
  release_date: string | null;
  portrait_url: string | null;
  metadata: Json;
};

type GuideTables = Database["public"]["Tables"];
type JoinedBuild = GuideTables["character_builds"]["Row"] & {
  character_build_equipment_recommendations: Array<
    Pick<GuideTables["character_build_equipment_recommendations"]["Row"],
      "recommendation_group" | "rank_order"> & {
      game_equipment: Pick<GuideTables["game_equipment"]["Row"],
        "id" | "name" | "equipment_type" | "rarity"> | null;
    }
  >;
  character_build_set_recommendations: Array<
    Pick<GuideTables["character_build_set_recommendations"]["Row"],
      "recommendation_group" | "rank_order"> & {
      game_equipment_sets: Pick<GuideTables["game_equipment_sets"]["Row"],
        "id" | "name" | "set_category" | "rarities"> | null;
    }
  >;
};

type JoinedCharacter = CharacterRow & {
  character_kits: GuideTables["character_kits"]["Row"] | null;
  character_builds: JoinedBuild[];
  character_team_comps: (GuideTables["character_team_comps"]["Row"] & {
    character_team_members: Pick<GuideTables["character_team_members"]["Row"],
      "team_id" | "slot_number" | "character_name" | "role" | "character_id">[];
  })[];
  character_guide_source_records: Pick<GuideTables["character_guide_source_records"]["Row"],
    "source_site" | "source_type" | "status" | "missing_fields" | "error">[];
};

type KitEntry = {
  id: string;
  type: string;
  rank: number;
  name: string;
  description: string;
};

type RankedItem = {
  rank: number;
  name: string;
  sourceRef?: string | null;
  assetPath?: string | null;
  iconPath?: string | null;
  assetMissing?: boolean;
  description?: string | null;
  canonical?: GuideEquipmentSummary | null;
};

type MainStats = {
  sand?: string;
  goblet?: string;
  circlet?: string;
  raw?: string;
};

type RotationStep = {
  step: number;
  text: string;
};

export type GuideCharacterCard = {
  id: string;
  slug: string;
  name: string;
  element: string;
  role: string | null;
  rarity: number | null;
  weaponType: string | null;
  iconPath: string | null;
  assetMissing: boolean;
  hasKit: boolean;
  hasBuild: boolean;
  hasTeams: boolean;
};

export type GuideMissingAsset = {
  type: "character" | "weapon" | "artifact";
  label: string;
  candidates: string[];
};

export type GuideCharacterDetail = GuideCharacterCard & {
  releaseDate: string | null;
  kit: {
    sourceUrl: string;
    normalAttack: KitEntry | null;
    elementalSkill: KitEntry | null;
    elementalBurst: KitEntry | null;
    passiveTalents: KitEntry[];
    constellations: KitEntry[];
    ruleTerms: Array<{ term: string }>;
  } | null;
  build: {
    sourceUrl: string;
    bestWeapons: RankedItem[];
    alternativeWeapons: RankedItem[];
    f2pWeapons: RankedItem[];
    bestArtifacts: RankedItem[];
    alternativeArtifacts: RankedItem[];
    mainStats: MainStats | null;
    substatPriority: RankedItem[];
    talentPriority: RankedItem[];
    energyRecharge: string | null;
    rotation: RotationStep[];
    rotationPlaystyle: string | null;
  } | null;
  teams: Array<{
    id: string;
    name: string;
    type: string | null;
    sourceUrl: string;
    members: Array<{
      slotNumber: number;
      characterName: string;
      role: string | null;
      iconPath: string | null;
      assetMissing: boolean;
    }>;
  }>;
  sourceRecords: Array<{
    sourceSite: string;
    sourceType: string;
    status: string;
    missingFields: string[];
    error: string | null;
  }>;
  missingAssets: GuideMissingAsset[];
};

export async function getGenshinGuideCharacters(): Promise<GuideCharacterCard[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data: characters, error } = await supabase
    .from("game_characters")
    .select("id, slug, display_name, element, weapon_type, rarity, release_date, portrait_url, metadata")
    .eq("game_id", GAME_ID)
    .order("display_name", { ascending: true });

  if (error || !characters) {
    console.error("Failed to load Genshin guide characters", error);
    return [];
  }

  const ids = characters.map((character) => character.id);
  const [kits, builds, teams] = await Promise.all([
    supabase.from("character_kits").select("character_id").in("character_id", ids),
    supabase.from("character_builds").select("character_id, role, source_site").in("character_id", ids),
    supabase.from("character_team_comps").select("character_id").in("character_id", ids),
  ]);

  const kitIds = new Set((kits.data ?? []).map((row) => row.character_id));
  const buildByCharacter = new Map<string, string | null>();
  for (const row of builds.data ?? []) {
    if (!buildByCharacter.has(row.character_id) || row.source_site === "manual") {
      buildByCharacter.set(row.character_id, row.role);
    }
  }
  const teamIds = new Set((teams.data ?? []).map((row) => row.character_id));

  return (characters as CharacterRow[]).map((character) =>
    toGuideCharacterCard(character, {
      role: buildByCharacter.get(character.id) ?? null,
      hasKit: kitIds.has(character.id),
      hasBuild: buildByCharacter.has(character.id),
      hasTeams: teamIds.has(character.id),
    }),
  );
}

export async function getGenshinGuideCharacter(
  characterSlug: string,
): Promise<GuideCharacterDetail | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data: character, error } = await supabase
    .from("game_characters")
    .select(`
      id, slug, display_name, element, weapon_type, rarity, release_date, portrait_url, metadata,
      character_kits(*),
      character_builds(*,
        character_build_equipment_recommendations(
          recommendation_group, rank_order,
          game_equipment(id, name, equipment_type, rarity)
        ),
        character_build_set_recommendations(
          recommendation_group, rank_order,
          game_equipment_sets(id, name, set_category, rarities)
        )
      ),
      character_team_comps(*, character_team_members(team_id, slot_number, character_name, role, character_id)),
      character_guide_source_records(source_site, source_type, status, missing_fields, error)
    `)
    .eq("game_id", GAME_ID)
    .eq("slug", characterSlug)
    .maybeSingle()
    .overrideTypes<JoinedCharacter | null, { merge: false }>();

  if (error || !character) {
    console.error("Failed to load Genshin guide character", error);
    return null;
  }

  // Fetch related rows together to avoid three sequential network round trips.
  const kitResult = { data: character.character_kits };
  const buildResult = { data: character.character_builds };
  const sourceRecordsResult = { data: character.character_guide_source_records };
  const teamRows = selectPublishedTeams(character.character_team_comps)
    .sort((a, b) => a.rank_order - b.rank_order);
  const members = teamRows.flatMap((team) => team.character_team_members)
    .sort((a, b) => a.slot_number - b.slot_number);

  const characterCard = toGuideCharacterCard(character as CharacterRow, {
    role: selectPublishedBuild(buildResult.data ?? [])?.role ?? null,
    hasKit: Boolean(kitResult.data),
    hasBuild: Boolean(buildResult.data),
    hasTeams: teamRows.length > 0,
  });

  const missingAssets: GuideMissingAsset[] = [];
  if (characterCard.assetMissing) {
    missingAssets.push({
      type: "character",
      label: character.display_name,
      candidates: resolveCharacterIcon(GAME_SLUG, character.slug, character.display_name).checkedCandidates,
    });
  }

  const buildRow = selectPublishedBuild(buildResult.data ?? []);
  const build = buildRow
    ? {
        sourceUrl: buildRow.source_url,
        bestWeapons: withWeaponAssets(
          asRankedItems(buildRow.best_weapons), missingAssets, buildRow, "best_weapon",
        ),
        alternativeWeapons: withWeaponAssets(
          asRankedItems(buildRow.alternative_weapons), missingAssets, buildRow, "alternative_weapon",
        ),
        f2pWeapons: withWeaponAssets(
          asRankedItems(buildRow.f2p_weapons), missingAssets, buildRow, "f2p_weapon",
        ),
        bestArtifacts: withArtifactAssets(
          asRankedItems(buildRow.best_artifacts), missingAssets, buildRow, "best_artifact",
        ),
        alternativeArtifacts: withArtifactAssets(
          asRankedItems(buildRow.alternative_artifacts), missingAssets, buildRow, "alternative_artifact",
        ),
        mainStats: asMainStats(buildRow.main_stats),
        substatPriority: asRankedItems(buildRow.substat_priority),
        talentPriority: asRankedItems(buildRow.talent_priority),
        energyRecharge: buildRow.energy_recharge,
        rotation: asRotation(buildRow.rotation),
        rotationPlaystyle: buildRow.rotation_playstyle,
      }
    : null;

  const membersByTeam = new Map<string, typeof members>();
  for (const member of members ?? []) {
    membersByTeam.set(member.team_id, [...(membersByTeam.get(member.team_id) ?? []), member]);
  }

  const teams = teamRows.map((team) => ({
    id: team.id,
    name: team.team_name ?? `Team ${team.rank_order}`,
    type: team.team_type,
    sourceUrl: team.source_url,
    members: (membersByTeam.get(team.id) ?? []).map((member) => {
      const memberAsset = resolveCharacterIcon(GAME_SLUG, slugify(member.character_name), member.character_name);
      if (memberAsset.missing) {
        missingAssets.push({
          type: "character",
          label: member.character_name,
          candidates: memberAsset.checkedCandidates,
        });
      }

      return {
        slotNumber: member.slot_number,
        characterName: member.character_name,
        role: member.role,
        iconPath: memberAsset.path,
        assetMissing: memberAsset.missing,
      };
    }),
  }));

  return {
    ...characterCard,
    releaseDate: character.release_date,
    kit: kitResult.data
      ? {
          sourceUrl: kitResult.data.source_url,
          normalAttack: asKitEntry(kitResult.data.normal_attack),
          elementalSkill: asKitEntry(kitResult.data.elemental_skill),
          elementalBurst: asKitEntry(kitResult.data.elemental_burst),
          passiveTalents: asKitEntries(kitResult.data.passive_talents),
          constellations: asKitEntries(kitResult.data.constellations),
          ruleTerms: asRuleTerms(kitResult.data.rule_terms),
        }
      : null,
    build,
    teams,
    sourceRecords: (sourceRecordsResult.data ?? []).map((record) => ({
      sourceSite: record.source_site,
      sourceType: record.source_type,
      status: record.status,
      missingFields: record.missing_fields,
      error: record.error,
    })),
    missingAssets: dedupeMissingAssets(missingAssets),
  };
}

function toGuideCharacterCard(
  character: CharacterRow,
  guideState: {
    role: string | null;
    hasKit: boolean;
    hasBuild: boolean;
    hasTeams: boolean;
  },
): GuideCharacterCard {
  const icon = character.portrait_url
    ? { path: character.portrait_url, missing: false }
    : resolveCharacterIcon(GAME_SLUG, character.slug, character.display_name);
  return {
    id: character.id,
    slug: character.slug,
    name: character.display_name,
    element: character.element ?? "Unknown",
    role: guideState.role,
    rarity: character.rarity,
    weaponType: character.weapon_type,
    iconPath: icon.path,
    assetMissing: icon.missing,
    hasKit: guideState.hasKit,
    hasBuild: guideState.hasBuild,
    hasTeams: guideState.hasTeams,
  };
}

function withWeaponAssets(
  items: RankedItem[],
  missingAssets: GuideMissingAsset[],
  build: JoinedBuild,
  recommendationGroup: string,
) {
  return items.map((item) => {
    const canonical = findCanonicalEquipment(build, recommendationGroup, item.rank);
    if (item.assetPath) {
      return { ...item, canonical, iconPath: item.assetPath, assetMissing: false };
    }

    const asset = resolveWeaponIcon(GAME_SLUG, item.name);
    if (asset.missing) {
      missingAssets.push({ type: "weapon", label: item.name, candidates: asset.checkedCandidates });
    }
    return { ...item, canonical, iconPath: asset.path, assetMissing: asset.missing };
  });
}

function withArtifactAssets(
  items: RankedItem[],
  missingAssets: GuideMissingAsset[],
  build: JoinedBuild,
  recommendationGroup: string,
) {
  return items.map((item) => {
    const canonical = findCanonicalSet(build, recommendationGroup, item.rank);
    if (item.assetPath) {
      return { ...item, canonical, iconPath: item.assetPath, assetMissing: false };
    }

    const asset = resolveArtifactIcon(GAME_SLUG, item.name);
    if (asset.missing) {
      missingAssets.push({ type: "artifact", label: item.name, candidates: asset.checkedCandidates });
    }
    return { ...item, canonical, iconPath: asset.path, assetMissing: asset.missing };
  });
}

function findCanonicalEquipment(
  build: JoinedBuild,
  recommendationGroup: string,
  rank: number,
): GuideEquipmentSummary | null {
  const link = build.character_build_equipment_recommendations.find(
    (item) => item.recommendation_group === recommendationGroup && item.rank_order === rank,
  );
  const equipment = link?.game_equipment;
  if (!equipment) return null;

  return {
    id: equipment.id,
    kind: "equipment",
    name: equipment.name,
    type: equipment.equipment_type ?? "weapon",
    rarity: equipment.rarity,
    rarities: null,
  };
}

function findCanonicalSet(
  build: JoinedBuild,
  recommendationGroup: string,
  rank: number,
): GuideEquipmentSummary | null {
  const link = build.character_build_set_recommendations.find(
    (item) => item.recommendation_group === recommendationGroup && item.rank_order === rank,
  );
  const equipmentSet = link?.game_equipment_sets;
  if (!equipmentSet) return null;

  return {
    id: equipmentSet.id,
    kind: "set",
    name: equipmentSet.name,
    type: equipmentSet.set_category,
    rarity: null,
    rarities: equipmentSet.rarities,
  };
}

function asRankedItems(value: Json): RankedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.name !== "string") return [];
    return [
      {
        rank: typeof item.rank === "number" ? item.rank : index + 1,
        name: item.name,
        sourceRef: typeof item.sourceRef === "string" ? item.sourceRef : null,
        assetPath: typeof item.assetPath === "string" ? item.assetPath : null,
        description: typeof item.description === "string" ? item.description : null,
      },
    ];
  });
}

function selectPublishedBuild<T extends { source_site: string }>(builds: T[]) {
  return builds.find((build) => build.source_site === "manual") ?? builds[0] ?? null;
}

function selectPublishedTeams<T extends { source_site: string }>(teams: T[]) {
  const manual = teams.filter((team) => team.source_site === "manual");
  return manual.length ? manual : teams.filter((team) => team.source_site !== "manual");
}

function asKitEntry(value: Json): KitEntry | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.description !== "string") {
    return null;
  }

  return {
    id: String(value.id ?? value.name),
    type: typeof value.type === "string" ? value.type : "talent",
    rank: typeof value.rank === "number" ? value.rank : 1,
    name: value.name,
    description: value.description,
  };
}

function asKitEntries(value: Json): KitEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map(asKitEntry).filter((entry): entry is KitEntry => Boolean(entry));
}

function asRuleTerms(value: Json) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) && typeof item.term === "string" ? { term: item.term } : null))
    .filter((item): item is { term: string } => Boolean(item));
}

function asMainStats(value: Json): MainStats | null {
  if (!isRecord(value)) return null;
  return {
    sand: typeof value.sand === "string" ? value.sand : undefined,
    goblet: typeof value.goblet === "string" ? value.goblet : undefined,
    circlet: typeof value.circlet === "string" ? value.circlet : undefined,
    raw: typeof value.raw === "string" ? value.raw : undefined,
  };
}

function asRotation(value: Json): RotationStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!isRecord(item) || typeof item.text !== "string") return null;
      return {
        step: typeof item.step === "number" ? item.step : index + 1,
        text: item.text,
      };
    })
    .filter((item): item is RotationStep => Boolean(item));
}

function dedupeMissingAssets(assets: GuideMissingAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = `${asset.type}:${asset.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
