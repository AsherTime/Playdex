import type { Json } from "@/types/database";

export type EditableRankedItem = {
  rank: number;
  name: string;
  sourceRef?: string | null;
  assetPath?: string | null;
  description?: string | null;
};

export type EditableMainStats = {
  sand?: string;
  goblet?: string;
  circlet?: string;
  raw?: string;
};

export type GuideEditorCharacterOption = {
  id: string;
  slug: string;
  name: string;
};

export type GuideEditorCatalogs = {
  weapons: string[];
  artifacts: string[];
  characters: GuideEditorCharacterOption[];
};

export type EditableKitEntry = {
  id: string;
  type: string;
  rank: number;
  name: string;
  description: string;
};

export type EditableGuideData = {
  character: {
    id: string;
    slug: string;
    name: string;
    gameId: string;
  };
  kit: {
    sourceUrl: string;
    normalAttack: EditableKitEntry | null;
    elementalSkill: EditableKitEntry | null;
    elementalBurst: EditableKitEntry | null;
    passiveTalents: EditableKitEntry[];
    constellations: EditableKitEntry[];
    ruleTerms: Array<{ term: string }>;
  } | null;
  build: {
    sourceUrl: string;
    buildName: string;
    role: string | null;
    bestWeapons: EditableRankedItem[];
    alternativeWeapons: EditableRankedItem[];
    f2pWeapons: EditableRankedItem[];
    bestArtifacts: EditableRankedItem[];
    alternativeArtifacts: EditableRankedItem[];
    mainStats: EditableMainStats;
    substatPriority: EditableRankedItem[];
    talentPriority: EditableRankedItem[];
    energyRecharge: string | null;
    rotation: Array<{ step: number; text: string }>;
    rotationPlaystyle: string;
    structuredSections: Json;
  } | null;
  teams: Array<{
    id: string;
    name: string;
    type: string | null;
    description: string | null;
    rankOrder: number;
    members: Array<{
      slotNumber: number;
      characterId: string | null;
      characterName: string;
      role: string | null;
      isFlex: boolean;
      alternatives: string[];
    }>;
  }>;
};

export type GuideRevisionStatus = "draft" | "pending_review" | "approved" | "published" | "rejected";

export type GuideRevisionSummary = {
  id: string;
  status: GuideRevisionStatus;
  title: string | null;
  gameId: string;
  characterId: string;
  characterName: string;
  characterSlug: string;
  authorUserId: string;
  authorName: string;
  authorEmail: string;
  sectionsChanged: string[];
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type GuideRevisionDetail = GuideRevisionSummary & {
  base: EditableGuideData;
  draft: EditableGuideData;
};

export type RevisionDiffLine = {
  section: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
};
