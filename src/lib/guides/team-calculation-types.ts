import type { Json } from "@/types/database";

export type TeamCalculationRow = {
  id: string;
  game_id: string;
  source: string;
  source_id: string;
  team_name: string;
  team_dps: number | null;
  dpr: number | null;
  rotation_seconds: number | null;
  details: Json;
};

export type TeamCalculationMemberRow = {
  calculation_id: string;
  slot: number;
  character_id: string;
  character_name: string;
  weapon_name: string | null;
  equipment_id: string | null;
  role: string | null;
  element: string | null;
  damage: number | null;
  damage_share: number | null;
  details: Json;
};

export type GuideTeamCalculation = TeamCalculationRow & {
  note: string | null;
  members: Array<TeamCalculationMemberRow & {
    portraitPath: string;
    weaponPath: string;
    characterSlug: string;
    note: string | null;
  }>;
};

export type GuideCalculations = { teams: GuideTeamCalculation[]; unavailable: boolean };
