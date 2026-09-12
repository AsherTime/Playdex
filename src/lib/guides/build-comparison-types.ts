import type { Json } from "@/types/database";
import type { GuideTeamCalculation } from "@/lib/guides/team-calculation-types";

export type CharacterAbilityRow = {
  id: string; game_id: string; character_id: string; source_site: string; source_id: string;
  ability_type: string; name: string; description: string; icon_url: string | null;
  sort_order: number; source_url: string; source_version: string | null; raw_data: Json;
  imported_at: string; last_checked_at: string;
};
export type ComparisonMetadata = {
  sheet: string; sheet_title: string; workbook: string; sha256: string; title_cell: string;
  context: string; mode: string | null; notes: string[]; index_version: string;
};
export type BuildComparisonRow = {
  id: string; game_id: string; character_id: string; comparison_type: string;
  title: string; source: string; source_version: string | null; status: string;
  metadata: ComparisonMetadata; imported_at: string; updated_at: string;
};
export type SetPart = { id: string; name: string; pieces: number };
export type ComparisonEntryDetails = {
  rank?: number | null; markers?: string[]; icon_url?: string | null; variant_note?: string | null;
  sequence?: number; relative_to_previous?: number | null; relative_to_s0?: number | null;
  primary_set_id?: string | null; primary_set_name?: string | null;
  secondary_sets?: SetPart[]; secondary_relation?: string | null; set_combinations?: SetPart[];
  cost_pattern?: number[]; main_stats?: Array<string | null>; stated_main_stats?: string[];
  main_echo?: { id: string; name: string; icon_url: string | null } | null;
  unresolved?: Array<{ kind: string; value: string }>;
};
export type BuildComparisonEntryRow = {
  id: string; comparison_id: string; equipment_id: string | null; set_id: string | null;
  label: string; raw_label: string; damage: number | null; relative_value: number | null;
  sort_order: number; details: ComparisonEntryDetails;
};
export type BuildComparison = BuildComparisonRow & { entries: BuildComparisonEntryRow[] };
export type WuwaRecommendation = { id: string; name: string; icon_url: string | null; note?: string | null; pieces?: number | null };
export type WuwaTeamMember = {
  characterId: string | null;
  name: string;
  role: string | null;
  portraitUrl: string | null;
};
export type WuwaTeam = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  members: WuwaTeamMember[];
  calculation: GuideTeamCalculation | null;
};
export type WuwaGuide = {
  id: string; slug: string; name: string; element: string | null; weapon_type: string | null; rarity: number | null;
  portrait_url: string | null;
  abilities: Array<Pick<CharacterAbilityRow, "id" | "ability_type" | "name" | "description" | "icon_url" | "sort_order">>;
  comparisons: BuildComparison[]; weapons: WuwaRecommendation[]; sets: WuwaRecommendation[]; writtenNotes: string[];
  teams: WuwaTeam[];
};
