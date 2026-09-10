export type GuideEquipmentSummary = {
  id: string;
  kind: "equipment" | "set";
  name: string;
  type: string;
  rarity: number | null;
  rarities: number[] | null;
};

export type GuideEquipmentStat = {
  key: string;
  name: string;
  levelOne: string | null;
  maxLevel: number | null;
  maxValue: string | null;
};

export type GuideEquipmentEffect = {
  rank: number;
  name: string | null;
  description: string | null;
};

export type GuideSetBonus = {
  piecesRequired: number;
  description: string | null;
};

export type GuideEquipmentDetails =
  | {
      kind: "equipment";
      id: string;
      name: string;
      type: string;
      rarity: number | null;
      stats: GuideEquipmentStat[];
      effects: GuideEquipmentEffect[];
    }
  | {
      kind: "set";
      id: string;
      name: string;
      type: string;
      rarities: number[] | null;
      bonuses: GuideSetBonus[];
    };
