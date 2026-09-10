import "server-only";

import type {
  GuideEquipmentDetails,
  GuideEquipmentEffect,
  GuideEquipmentStat,
  GuideSetBonus,
} from "@/lib/guides/equipment-types";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Json } from "@/types/database";

export async function getGuideEquipmentDetails(
  kind: "equipment" | "set",
  id: string,
): Promise<GuideEquipmentDetails | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  if (kind === "equipment") {
    const { data: equipment, error } = await supabase
      .from("game_equipment")
      .select("id, name, equipment_type, rarity")
      .eq("id", id)
      .maybeSingle();
    if (error || !equipment) return null;

    const [{ data: stats }, { data: effects }] = await Promise.all([
      supabase
        .from("game_equipment_stats")
        .select("stat_key, stat_name, value, display_value, level, ascension, sort_order, metadata")
        .eq("equipment_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("game_equipment_effects")
        .select("rank, name, description, sort_order")
        .eq("equipment_id", id)
        .order("rank", { ascending: true })
        .order("sort_order", { ascending: true }),
    ]);

    return {
      kind: "equipment",
      id: equipment.id,
      name: equipment.name,
      type: equipment.equipment_type ?? "weapon",
      rarity: equipment.rarity,
      stats: summarizeEquipmentStats(stats ?? []),
      effects: (effects ?? []).map(
        (effect): GuideEquipmentEffect => ({
          rank: effect.rank,
          name: effect.name,
          description: effect.description,
        }),
      ),
    };
  }

  const { data: equipmentSet, error } = await supabase
    .from("game_equipment_sets")
    .select("id, name, set_category, rarities")
    .eq("id", id)
    .maybeSingle();
  if (error || !equipmentSet) return null;

  const { data: bonuses } = await supabase
    .from("game_equipment_set_bonuses")
    .select("pieces_required, description, sort_order")
    .eq("set_id", id)
    .order("pieces_required", { ascending: true })
    .order("sort_order", { ascending: true });

  return {
    kind: "set",
    id: equipmentSet.id,
    name: equipmentSet.name,
    type: equipmentSet.set_category,
    rarities: equipmentSet.rarities,
    bonuses: (bonuses ?? []).map(
      (bonus): GuideSetBonus => ({
        piecesRequired: bonus.pieces_required,
        description: bonus.description,
      }),
    ),
  };
}

type StatRow = {
  stat_key: string;
  stat_name: string | null;
  value: number | null;
  display_value: string | null;
  level: number | null;
  ascension: number | null;
  sort_order: number;
  metadata: Json;
};

/** Genshin weapons currently cap at Lv90. Nanoka curves also include Lv91–100. */
const GENSHIN_WEAPON_MAX_LEVEL = 90;

function summarizeEquipmentStats(rows: StatRow[]): GuideEquipmentStat[] {
  const keys = [...new Set(rows.map((row) => row.stat_key))];

  return keys
    .map((statKey) => {
      const keyRows = rows.filter((row) => row.stat_key === statKey);
      const curveRows = keyRows.filter(
        (row) =>
          (readMetaString(row.metadata, "component") === "level_curve" ||
            (row.level != null && row.ascension == null)) &&
          row.level != null,
      );
      const ascensionRows = keyRows.filter(
        (row) =>
          (readMetaString(row.metadata, "component") === "ascension_bonus" ||
            (row.level == null && row.ascension != null)) &&
          row.ascension != null &&
          row.value != null,
      );

      const sample = keyRows[0];
      const unit = sample ? readMetaString(sample.metadata, "unit") : null;
      const levelOneRow = curveRows.find((row) => row.level === 1) ?? null;
      const targetLevel = resolveWeaponDisplayMaxLevel(curveRows.map((row) => row.level as number));
      const maxCurveRow =
        targetLevel == null ? null : (curveRows.find((row) => row.level === targetLevel) ?? null);

      const neededAscension =
        targetLevel == null ? null : fullyAscendedPhaseForWeaponLevel(targetLevel);
      const ascensionBonusRow =
        neededAscension == null
          ? null
          : (ascensionRows.find((row) => row.ascension === neededAscension) ?? null);

      let maxValue = maxCurveRow ? formatStatDisplay(maxCurveRow) : null;
      if (maxCurveRow?.value != null && ascensionBonusRow?.value != null) {
        // Weapon ascension bonuses are flat base ATK only; secondaries stay curve-only.
        if (unit !== "percent") {
          maxValue = trimNumber(maxCurveRow.value + ascensionBonusRow.value);
        }
      }

      return {
        key: statKey,
        name: sample?.stat_name ?? humanizeStatKey(statKey),
        levelOne: levelOneRow ? formatStatDisplay(levelOneRow) : null,
        maxLevel: targetLevel,
        maxValue,
        sortOrder: sample?.sort_order ?? 0,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...stat }) => stat)
    .filter((stat) => stat.levelOne || stat.maxValue);
}

/**
 * Prefer exact Nanoka Lv90 when present. Never promote Lv91–100 just because
 * those curve keys exist in the source dump.
 */
function resolveWeaponDisplayMaxLevel(levels: number[]): number | null {
  if (!levels.length) return null;
  if (levels.includes(GENSHIN_WEAPON_MAX_LEVEL)) return GENSHIN_WEAPON_MAX_LEVEL;
  const playable = levels.filter((level) => level <= GENSHIN_WEAPON_MAX_LEVEL);
  if (playable.length) return Math.max(...playable);
  return null;
}

/** Fully ascended phase required to be at the given weapon level cap. */
function fullyAscendedPhaseForWeaponLevel(level: number): number {
  if (level >= 90) return 6;
  if (level >= 80) return 5;
  if (level >= 70) return 4;
  if (level >= 60) return 3;
  if (level >= 50) return 2;
  if (level >= 40) return 1;
  return 0;
}

function formatStatDisplay(row: StatRow) {
  if (row.display_value) return row.display_value;
  if (row.value == null) return null;
  const unit = readMetaString(row.metadata, "unit");
  if (unit === "percent") return `${trimNumber(row.value * 100)}%`;
  return trimNumber(row.value);
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function humanizeStatKey(key: string) {
  return key
    .replace(/^FIGHT_PROP_/, "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readMetaString(metadata: Json, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}
