/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterComparison, GameType, Team } from '../types';
import { normalizeTeamForGame } from '../data/defaultTeam';
import { getWuWaCharacterDefinition } from '../data/wuwaData';
import { getCharacterAssetMatch, getWeaponAssetMatch } from './imageMatcher';

const GENSHIN_STORAGE_KEY = 'genshin_teams';
const WUWA_STORAGE_KEY = 'wuwa_teams';
const CHARACTER_COMPARISON_STORAGE_KEY = 'genshin_character_comparisons';
const TEAMS_API_ENDPOINT = '/api/teams';
const TEAM_STORAGE_MIGRATION_KEY = 'team_storage_folder_migration_v1';
const LEGACY_TEAM_STORAGE_KEYS = [GENSHIN_STORAGE_KEY, WUWA_STORAGE_KEY] as const;
let teamMigrationPromise: Promise<void> | null = null;

const buildWuWaWarningState = (team: Team): Pick<Team, 'unresolvedWarnings' | 'unmatchedItems' | 'unmatchedCount'> => {
  const unmatchedItems: string[] = [];

  team.characters.forEach((character, index) => {
    const slotLabel = `Slot ${index + 1}`;
    const characterName = character.name.trim();
    const weaponName = character.weaponName.trim();

    if (!characterName) {
      unmatchedItems.push(`${slotLabel}: character name is missing`);
    } else {
      if (!getWuWaCharacterDefinition(characterName)) {
        unmatchedItems.push(`${slotLabel}: unknown character "${characterName}"`);
      }

      if (!character.manualCharacterImage && !getCharacterAssetMatch(characterName, 'wuwa').matched) {
        unmatchedItems.push(`${slotLabel}: character image not matched for "${characterName}"`);
      }
    }

    if (!weaponName) {
      unmatchedItems.push(`${slotLabel}: weapon name is missing`);
    } else if (!character.manualWeaponImage && !getWeaponAssetMatch(weaponName, 'wuwa').matched) {
      unmatchedItems.push(`${slotLabel}: weapon image not matched for "${weaponName}"`);
    }
  });

  return {
    unresolvedWarnings: unmatchedItems.length > 0,
    unmatchedItems,
    unmatchedCount: unmatchedItems.length,
  };
};

const sanitizeTeamForStorage = (team: Team): Team => {
  const normalizedTeam = normalizeTeamForGame(team);

  if (normalizedTeam.gameType !== 'wuwa') {
    return {
      ...normalizedTeam,
      unresolvedWarnings: false,
      unmatchedItems: [],
      unmatchedCount: 0,
    };
  }

  return {
    ...normalizedTeam,
    ...buildWuWaWarningState(normalizedTeam),
  };
};

const sortTeams = (teams: Team[]): Team[] => {
  return [...teams].sort((a, b) => {
    const aDps = a.dps ?? -1;
    const bDps = b.dps ?? -1;
    if (bDps !== aDps) {
      return bDps - aDps;
    }
    return b.totalDamage - a.totalDamage;
  });
};

const getStorageKeyByGameType = (gameType: GameType): string =>
  gameType === 'wuwa' ? WUWA_STORAGE_KEY : GENSHIN_STORAGE_KEY;

const getLegacyTeamsFromLocalStorage = (gameType: GameType): Team[] => {
  const stored = localStorage.getItem(getStorageKeyByGameType(gameType));
  if (!stored) return [];
  try {
    return sortTeams(
      (JSON.parse(stored) as Team[])
        .map(sanitizeTeamForStorage)
        .filter((team) => (team.gameType || 'genshin') === gameType)
    );
  } catch (e) {
    console.error('Failed to parse teams from localStorage', e);
    return [];
  }
};

const getAllLegacyTeamsFromLocalStorage = (): Team[] => {
  return [...getLegacyTeamsFromLocalStorage('genshin'), ...getLegacyTeamsFromLocalStorage('wuwa')];
};

const clearLegacyTeamsFromLocalStorage = (): void => {
  LEGACY_TEAM_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const getTeamSignature = (team: Team): string => {
  const characterNames = [...team.characters]
    .map((character) => character.name.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
  return [
    team.gameType || 'genshin',
    characterNames,
    team.teamName.trim().toLowerCase(),
    Math.round(team.totalDamage),
    Number(team.rotation).toFixed(1),
  ].join('::');
};

const fetchAllTeamsFromApi = async (): Promise<Team[]> => {
  const response = await fetch(TEAMS_API_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Failed to load teams: ${response.status}`);
  }

  return ((await response.json()) as Team[]).map(sanitizeTeamForStorage);
};

const ensureFolderBackedTeamStorage = async (): Promise<void> => {
  if (!teamMigrationPromise) {
    teamMigrationPromise = (async () => {
      if (localStorage.getItem(TEAM_STORAGE_MIGRATION_KEY) === 'done') {
        return;
      }

      const legacyTeams = getAllLegacyTeamsFromLocalStorage();
      if (!legacyTeams.length) {
        localStorage.setItem(TEAM_STORAGE_MIGRATION_KEY, 'done');
        return;
      }

      const apiTeams = await fetchAllTeamsFromApi();
      const existingIds = new Set(apiTeams.map((team) => team.id));
      const existingSignatures = new Set(apiTeams.map(getTeamSignature));

      for (const legacyTeam of legacyTeams.map(sanitizeTeamForStorage)) {
        if (existingIds.has(legacyTeam.id) || existingSignatures.has(getTeamSignature(legacyTeam))) {
          continue;
        }

        const response = await fetch(`${TEAMS_API_ENDPOINT}/${encodeURIComponent(legacyTeam.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(legacyTeam),
        });

        if (!response.ok) {
          throw new Error(`Failed to migrate team ${legacyTeam.id}: ${response.status}`);
        }
      }

      clearLegacyTeamsFromLocalStorage();
      localStorage.setItem(TEAM_STORAGE_MIGRATION_KEY, 'done');
    })().catch((error) => {
      teamMigrationPromise = null;
      throw error;
    });
  }

  return teamMigrationPromise;
};

export const getTeams = async (gameType: GameType = 'genshin'): Promise<Team[]> => {
  await ensureFolderBackedTeamStorage();
  const teams = sortTeams(await fetchAllTeamsFromApi()).filter(
    (team) => (team.gameType || 'genshin') === gameType
  );
  return teams;
};

export const saveTeam = async (team: Team): Promise<Team> => {
  await ensureFolderBackedTeamStorage();
  const normalizedTeam = sanitizeTeamForStorage(team);
  const response = await fetch(`${TEAMS_API_ENDPOINT}/${encodeURIComponent(normalizedTeam.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedTeam),
  });

  if (!response.ok) {
    throw new Error(`Failed to save team: ${response.status}`);
  }

  return normalizedTeam;
};

export const deleteTeam = async (id: string, gameType: GameType = 'genshin'): Promise<void> => {
  await ensureFolderBackedTeamStorage();
  const response = await fetch(`${TEAMS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete team: ${response.status}`);
  }
};

export const duplicateTeam = async (team: Team): Promise<Team> => {
  const newTeam = {
    ...team,
    id: crypto.randomUUID(),
    teamName: `${team.teamName} (Copy)`,
    createdAt: Date.now(),
  };
  await saveTeam(newTeam);
  return sanitizeTeamForStorage(newTeam);
};

export const exportTeamsToJSON = async (gameType: GameType = 'genshin'): Promise<void> => {
  const teams = await getTeams(gameType);
  const dataStr = JSON.stringify(teams, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = gameType === 'wuwa' ? 'wuwa-teams.json' : 'genshin-teams.json';

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importTeamsFromJSON = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await ensureFolderBackedTeamStorage();
        const importedTeams = JSON.parse(e.target?.result as string) as Team[];
        if (!Array.isArray(importedTeams)) {
          throw new Error('Invalid file format');
        }

        const teamsByGame = importedTeams.reduce<Record<GameType, Team[]>>(
          (acc, team) => {
            const gameType = (team.gameType || 'genshin') as GameType;
            acc[gameType].push(team);
            return acc;
          },
          { genshin: [], wuwa: [] }
        );

        const currentGenshin = (await getTeams('genshin')).map(sanitizeTeamForStorage);
        const currentWuWa = (await getTeams('wuwa')).map(sanitizeTeamForStorage);
        const currentTeamIds = new Set([
          ...currentGenshin.map((team) => team.id),
          ...currentWuWa.map((team) => team.id),
        ]);
        const teamsToAdd = [...teamsByGame.genshin, ...teamsByGame.wuwa].filter(
          (team) => !currentTeamIds.has(team.id)
        );

        for (const team of teamsToAdd) {
          await saveTeam(team);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const getCharacterComparisonsFromLocalStorage = (): CharacterComparison[] => {
  const stored = localStorage.getItem(CHARACTER_COMPARISON_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as CharacterComparison[];
    return parsed
      .map((comparison) => ({
        ...comparison,
        gameType: comparison.gameType || 'genshin',
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error('Failed to parse character comparisons from localStorage', e);
    return [];
  }
};

const setCharacterComparisonsToLocalStorage = (comparisons: CharacterComparison[]): void => {
  localStorage.setItem(CHARACTER_COMPARISON_STORAGE_KEY, JSON.stringify(comparisons));
};

export const getCharacterComparisons = (): CharacterComparison[] => {
  return getCharacterComparisonsFromLocalStorage();
};

export const saveCharacterComparison = (comparison: CharacterComparison): void => {
  const comparisons = getCharacterComparisonsFromLocalStorage();
  const normalizedComparison: CharacterComparison = {
    ...comparison,
    gameType: comparison.gameType || 'genshin',
  };
  const existingIndex = comparisons.findIndex((item) => item.id === normalizedComparison.id);

  if (existingIndex > -1) comparisons[existingIndex] = normalizedComparison;
  else comparisons.push(normalizedComparison);

  setCharacterComparisonsToLocalStorage(
    [...comparisons].sort((a, b) => b.createdAt - a.createdAt)
  );
};

export const deleteCharacterComparison = (id: string): void => {
  const comparisons = getCharacterComparisonsFromLocalStorage();
  const filtered = comparisons.filter((item) => item.id !== id);
  setCharacterComparisonsToLocalStorage(filtered);
};

export const duplicateCharacterComparison = (comparison: CharacterComparison): CharacterComparison => {
  const duplicated: CharacterComparison = {
    ...comparison,
    id: crypto.randomUUID(),
    title: `${comparison.title || 'Untitled'} (Copy)`,
    createdAt: Date.now(),
    entries: comparison.entries.map((entry) => ({
      ...entry,
      id: crypto.randomUUID(),
    })),
  };
  saveCharacterComparison(duplicated);
  return duplicated;
};
