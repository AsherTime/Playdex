export type TierListRow = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  version: string | null;
  source_url: string | null;
  source_updated_at: string | null;
  seeded_at: string;
  tiers: string[];
  roles: string[];
  revision: number;
  updated_at: string;
};

export type TierEntryInput = {
  character_id: string;
  role: string;
  tier: string;
  sort_order: number;
  notes: string | null;
};
export type TierEntryRow = TierEntryInput & { tier_list_id: string };
export type TierCharacter = {
  id: string;
  slug: string;
  name: string;
  element: string | null;
  icon: string | null;
};
export type TierListData = {
  list: TierListRow;
  entries: TierEntryInput[];
  characters: TierCharacter[];
};
