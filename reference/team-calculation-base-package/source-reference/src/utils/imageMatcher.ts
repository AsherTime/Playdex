/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CHARACTER_ASSET_FILES,
  WEAPON_ASSET_FILES,
} from '../data/assetManifest';
import {
  WUWA_CHARACTER_ASSET_FILES,
  WUWA_WEAPON_ASSET_FILES,
  getWuWaCharacterDefinition,
} from '../data/wuwaData';
import { GameType } from '../types';

export const normalizeFileName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[()#]/g, ' ')
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\./g, '') // Remove dots
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
};

type AssetKind = 'characters' | 'weapons';

interface AssetCandidate {
  fileName: string;
  normalizedBase: string;
  simplified: string;
  tokens: string[];
}

const stripExtension = (fileName: string): string => fileName.replace(/\.(webp|png)$/i, '');

const simplifyForCompare = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[()#]/g, ' ')
    .replace(/['.]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toTokenStem = (token: string): string => {
  if (token.length > 3 && token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
};

const tokenize = (value: string): string[] => {
  return simplifyForCompare(value)
    .split(' ')
    .map(toTokenStem)
    .filter(Boolean);
};

const makeBigrams = (value: string): string[] => {
  if (value.length <= 1) return [value];
  const normalized = value.replace(/\s+/g, '');
  const grams: string[] = [];
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.push(normalized.slice(i, i + 2));
  }
  return grams;
};

const diceSimilarity = (left: string, right: string): number => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftBigrams = makeBigrams(left);
  const rightBigrams = makeBigrams(right);
  const rightCounts = new Map<string, number>();

  rightBigrams.forEach((gram) => {
    rightCounts.set(gram, (rightCounts.get(gram) || 0) + 1);
  });

  let overlap = 0;
  leftBigrams.forEach((gram) => {
    const count = rightCounts.get(gram) || 0;
    if (count > 0) {
      overlap += 1;
      rightCounts.set(gram, count - 1);
    }
  });

  return (2 * overlap) / (leftBigrams.length + rightBigrams.length);
};

const tokenOverlapScore = (leftTokens: string[], rightTokens: string[]): number => {
  if (!leftTokens.length || !rightTokens.length) return 0;
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let overlap = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) overlap += 1;
  });

  return overlap / Math.max(leftSet.size, rightSet.size);
};

const buildCandidates = (files: readonly string[]): AssetCandidate[] =>
  files.map((fileName) => {
    const baseName = stripExtension(fileName);
    return {
      fileName,
      normalizedBase: normalizeFileName(baseName),
      simplified: simplifyForCompare(baseName),
      tokens: tokenize(baseName),
    };
  });

const GENSHIN_CHARACTER_CANDIDATES = buildCandidates(CHARACTER_ASSET_FILES);
const GENSHIN_WEAPON_CANDIDATES = buildCandidates(WEAPON_ASSET_FILES);
const WUWA_CHARACTER_CANDIDATES = buildCandidates(WUWA_CHARACTER_ASSET_FILES);
const WUWA_WEAPON_CANDIDATES = buildCandidates(WUWA_WEAPON_ASSET_FILES);

const findBestAssetFile = (name: string, candidates: AssetCandidate[]): string | null => {
  if (!name.trim()) return null;

  const normalizedInput = normalizeFileName(name);
  const exactWebpFile = `${normalizedInput}.webp`;
  const exactPngFile = `${normalizedInput}.png`;
  if (candidates.some((candidate) => candidate.fileName === exactWebpFile)) {
    return exactWebpFile;
  }
  if (candidates.some((candidate) => candidate.fileName === exactPngFile)) {
    return exactPngFile;
  }

  const simplifiedInput = simplifyForCompare(name);
  const inputTokens = tokenize(name);

  const simplifiedExact = candidates.find((candidate) => candidate.simplified === simplifiedInput);
  if (simplifiedExact) return simplifiedExact.fileName;

  let bestMatch: { fileName: string; score: number } | null = null;

  candidates.forEach((candidate) => {
    let score = 0;

    if (candidate.simplified.includes(simplifiedInput) || simplifiedInput.includes(candidate.simplified)) {
      score = Math.max(score, 0.78);
    }

    const overlap = tokenOverlapScore(inputTokens, candidate.tokens);
    if (overlap >= 0.5) {
      score = Math.max(score, 0.8 + overlap * 0.15);
    }

    const similarity = diceSimilarity(simplifiedInput, candidate.simplified);
    score = Math.max(score, similarity * 0.95);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { fileName: candidate.fileName, score };
    }
  });

  // Conservative threshold avoids random unrelated matches.
  if (bestMatch && bestMatch.score >= 0.82) {
    return bestMatch.fileName;
  }

  return null;
};

const encodeAssetPath = (root: string, fileName: string): string => {
  return `${root}/${encodeURIComponent(fileName)}`;
};

const getAssetCandidates = (kind: AssetKind, gameType: GameType): AssetCandidate[] => {
  if (gameType === 'wuwa') {
    return kind === 'characters' ? WUWA_CHARACTER_CANDIDATES : WUWA_WEAPON_CANDIDATES;
  }
  return kind === 'characters' ? GENSHIN_CHARACTER_CANDIDATES : GENSHIN_WEAPON_CANDIDATES;
};

export interface AssetMatchResult {
  matched: boolean;
  matchedFile: string | null;
  path: string | null;
}

const getAssetMatch = (
  name: string,
  kind: AssetKind,
  gameType: GameType = 'genshin'
): AssetMatchResult => {
  if (!name.trim()) {
    return {
      matched: false,
      matchedFile: null,
      path: null,
    };
  }

  const isWuWa = gameType === 'wuwa';
  const candidates = getAssetCandidates(kind, gameType);
  const matchName =
    isWuWa && kind === 'characters'
      ? getWuWaCharacterDefinition(name)?.canonicalName || name
      : name;
  const matchedFile = findBestAssetFile(matchName, candidates);

  if (matchedFile) {
    return {
      matched: true,
      matchedFile,
      path: isWuWa
        ? encodeAssetPath(`/assets/wuwa/${kind}`, matchedFile)
        : encodeAssetPath(`/assets/${kind}`, matchedFile),
    };
  }

  return {
    matched: false,
    matchedFile: null,
    path: isWuWa ? null : encodeAssetPath(`/assets/${kind}`, `${normalizeFileName(name)}.webp`),
  };
};

export const getCharacterAssetMatch = (
  name: string,
  gameType: GameType = 'genshin'
): AssetMatchResult => {
  return getAssetMatch(name, 'characters', gameType);
};

export const getWeaponAssetMatch = (
  name: string,
  gameType: GameType = 'genshin'
): AssetMatchResult => {
  return getAssetMatch(name, 'weapons', gameType);
};

export const getCharacterImagePath = (
  name: string,
  gameType: GameType = 'genshin'
): string | null => {
  return getCharacterAssetMatch(name, gameType).path;
};

export const getWeaponImagePath = (
  name: string,
  gameType: GameType = 'genshin'
): string | null => {
  return getWeaponAssetMatch(name, gameType).path;
};

export const getResolvedImage = (autoPath: string | null, manualImage?: string): string | null => {
  return manualImage || autoPath;
};

export const resolveWuWaRemoteAsset = async (
  _name: string,
  _kind: AssetKind
): Promise<string | null> => {
  // WuWa assets are resolved from local bundled files only.
  return null;
};
