/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GenshinElementType =
  | 'Pyro'
  | 'Hydro'
  | 'Dendro'
  | 'Electro'
  | 'Anemo'
  | 'Cryo'
  | 'Geo';
export type WuWaElementType = 'Aero' | 'Glacio' | 'Electro' | 'Fusion' | 'Spectro' | 'Havoc';
export type ElementType = GenshinElementType | WuWaElementType;
export type GameType = 'genshin' | 'wuwa';

export interface Character {
  id: string;
  name: string;
  weaponName: string;
  role: string;
  share: number;
  element: ElementType;
  manualCharacterImage: string;
  manualWeaponImage: string;
}

export interface Team {
  id: string;
  gameType: GameType;
  teamName: string;
  note?: string;
  dps?: number;
  totalDamage: number;
  rotation: number;
  createdAt: number;
  characters: Character[];
  unresolvedWarnings?: boolean;
  unmatchedItems?: string[];
  unmatchedCount?: number;
}

export interface CharacterComparisonEntry {
  id: string;
  characterName: string;
  weaponName: string;
  setupLabel: string;
  value: number;
  displayLabel: string;
  element: ElementType;
  manualCharacterImage: string;
  manualWeaponImage: string;
}

export interface CharacterComparison {
  id: string;
  gameType: GameType;
  title: string;
  subtitle: string;
  entryCount: number;
  createdAt: number;
  entries: CharacterComparisonEntry[];
}

export const GENSHIN_ELEMENT_TYPES: readonly GenshinElementType[] = [
  'Pyro',
  'Hydro',
  'Dendro',
  'Electro',
  'Anemo',
  'Cryo',
  'Geo',
];

export const WUWA_ELEMENT_TYPES: readonly WuWaElementType[] = [
  'Aero',
  'Glacio',
  'Electro',
  'Fusion',
  'Spectro',
  'Havoc',
];

export const GENSHIN_ELEMENT_COLORS: Record<GenshinElementType, { primary: string; accent: string }> = {
  Pyro: { primary: '#E25822', accent: '#FF6A2A' },
  Hydro: { primary: '#1C8FE0', accent: '#4FC3F7' },
  Dendro: { primary: '#6DDC6D', accent: '#A8F08C' },
  Electro: { primary: '#A55CCF', accent: '#D08CFF' },
  Anemo: { primary: '#64E3C3', accent: '#9FFFE0' },
  Cryo: { primary: '#9BE0F9', accent: '#D6F4FF' },
  Geo: { primary: '#D4A017', accent: '#F2C94C' },
};

export const WUWA_ELEMENT_COLORS: Record<WuWaElementType, { primary: string; accent: string }> = {
  Aero: { primary: '#44C4A3', accent: '#44C4A3' },
  Glacio: { primary: '#4FB4CF', accent: '#4FB4CF' },
  Electro: { primary: '#C154C7', accent: '#C154C7' },
  Fusion: { primary: '#D45772', accent: '#D45772' },
  Spectro: { primary: '#B7A835', accent: '#B7A835' },
  Havoc: { primary: '#BE4981', accent: '#BE4981' },
};

export const getElementColors = (
  element: ElementType,
  gameType: GameType = 'genshin'
): { primary: string; accent: string } => {
  if (gameType === 'wuwa' && isWuWaElement(element)) {
    return WUWA_ELEMENT_COLORS[element];
  }
  if (isGenshinElement(element)) {
    return GENSHIN_ELEMENT_COLORS[element];
  }
  if (isWuWaElement(element)) {
    return WUWA_ELEMENT_COLORS[element];
  }
  return GENSHIN_ELEMENT_COLORS.Pyro;
};

export const isGenshinElement = (element: ElementType): element is GenshinElementType => {
  return GENSHIN_ELEMENT_TYPES.includes(element as GenshinElementType);
};

export const isWuWaElement = (element: ElementType): element is WuWaElementType => {
  return WUWA_ELEMENT_TYPES.includes(element as WuWaElementType);
};

export const COMMON_ROLES = [
  'Main DPS',
  'Sub DPS',
  'Support',
  'Healer',
  'Buffer',
  'Debuffer',
  'Shielder',
];
