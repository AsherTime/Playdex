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

function summarizeEquipmentStats(rows: StatRow[]): GuideEquipmentStat[] {
  const byKey = new Map<
    string,
    {
      name: string;
      sortOrder: number;
      levelOne: string | null;
      maxLevel: number | null;
      maxCurve: string | null;
      maxAscensionBonus: number | null;
      unit: string | null;
    }
  >();

  for (const row of rows) {
    const component = readMetaString(row.metadata, "component");
    const unit = readMetaString(row.metadata, "unit");
    const current = byKey.get(row.stat_key) ?? {
      name: row.stat_name ?? humanizeStatKey(row.stat_key),
      sortOrder: row.sort_order,
      levelOne: null,
      maxLevel: null,
      maxCurve: null,
      maxAscensionBonus: null,
      unit,
    };

    if (component === "level_curve" || (row.level != null && row.ascension == null)) {
      if (row.level === 1) current.levelOne = formatStatDisplay(row);
      if (current.maxLevel == null || (row.level ?? 0) >= current.maxLevel) {
        current.maxLevel = row.level;
        current.maxCurve = formatStatDisplay(row);
      }
    }

    if (component === "ascension_bonus" || (row.level == null && row.ascension != null)) {
      if (row.value != null && (current.maxAscensionBonus == null || row.ascension === 6 || row.value > current.maxAscensionBonus)) {
        // Prefer the highest ascension phase when available.
        if (current.maxAscensionBonus == null || (row.ascension ?? 0) >= 6) {
          current.maxAscensionBonus = row.value;
        }
      }
    }

    byKey.set(row.stat_key, current);
  }

  return [...byKey.entries()]
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([key, value]) => {
      let maxValue = value.maxCurve;
      if (value.maxCurve && value.maxAscensionBonus != null) {
        const curveNumber = Number.parseFloat(value.maxCurve.replace(/[^\d.-]/g, ""));
        if (Number.isFinite(curveNumber)) {
          const total = curveNumber + value.maxAscensionBonus * (value.unit === "percent" ? 100 : 1);
          maxValue =
            value.unit === "percent"
              ? `${trimNumber(total)}%`
              : trimNumber(total);
        }
      }

      return {
        key,
        name: value.name,
        levelOne: value.levelOne,
        maxLevel: value.maxLevel,
        maxValue,
      };
    })
    .filter((stat) => stat.levelOne || stat.maxValue);
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
