/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWuWaCharacterElement } from './wuwaData';
import {
  Character,
  ElementType,
  GameType,
  GenshinElementType,
  Team,
  WuWaElementType,
  isGenshinElement,
  isWuWaElement,
} from '../types';

const getSlotCount = (gameType: GameType): number => (gameType === 'wuwa' ? 3 : 4);

const getDefaultShare = (gameType: GameType): number => (gameType === 'wuwa' ? 33 : 25);

const getDefaultElement = (gameType: GameType): ElementType =>
  gameType === 'wuwa' ? ('Aero' as WuWaElementType) : ('Pyro' as GenshinElementType);

export const normalizeElementForGame = (
  element: ElementType,
  gameType: GameType,
  characterName = ''
): ElementType => {
  if (gameType === 'wuwa') {
    const knownElement = getWuWaCharacterElement(characterName);
    if (knownElement) return knownElement;
    return isWuWaElement(element) ? element : ('Aero' as WuWaElementType);
  }

  return isGenshinElement(element) ? element : ('Pyro' as GenshinElementType);
};

export const createDefaultCharacter = (gameType: GameType, share = getDefaultShare(gameType)): Character => ({
  id: crypto.randomUUID(),
  name: '',
  weaponName: '',
  role: 'Main DPS',
  share,
  element: getDefaultElement(gameType),
  manualCharacterImage: '',
  manualWeaponImage: '',
});

const createDefaultCharacters = (gameType: GameType) =>
  Array.from({ length: getSlotCount(gameType) }, () => createDefaultCharacter(gameType));

export const normalizeTeamForGame = (inputTeam: Team): Team => {
  const gameType: GameType = inputTeam.gameType || 'genshin';
  const slotCount = getSlotCount(gameType);
  const defaultShare = getDefaultShare(gameType);
  const baseCharacters = inputTeam.characters ?? [];
  const normalizedCharacters =
    baseCharacters.length >= slotCount
      ? baseCharacters.slice(0, slotCount)
      : [
          ...baseCharacters,
          ...Array.from({ length: slotCount - baseCharacters.length }, () =>
            createDefaultCharacter(gameType, defaultShare)
          ),
        ];

  return {
    ...inputTeam,
    gameType,
    note: gameType === 'wuwa' ? inputTeam.note ?? '' : undefined,
    dps: gameType === 'genshin' ? inputTeam.dps ?? 0 : undefined,
    unresolvedWarnings: inputTeam.unresolvedWarnings ?? false,
    unmatchedItems: inputTeam.unmatchedItems ?? [],
    unmatchedCount: inputTeam.unmatchedCount ?? 0,
    characters: normalizedCharacters.map((character) => ({
      ...character,
      share: Number.isFinite(character.share) && character.share > 0 ? character.share : defaultShare,
      element: normalizeElementForGame(character.element, gameType, character.name),
    })),
  };
};

export const createDefaultTeam = (gameType: GameType = 'genshin'): Team => ({
  id: crypto.randomUUID(),
  gameType,
  teamName: '',
  note: gameType === 'wuwa' ? '' : undefined,
  dps: gameType === 'genshin' ? 0 : undefined,
  totalDamage: 0,
  rotation: 20,
  createdAt: Date.now(),
  unresolvedWarnings: false,
  unmatchedItems: [],
  unmatchedCount: 0,
  characters: createDefaultCharacters(gameType),
});
