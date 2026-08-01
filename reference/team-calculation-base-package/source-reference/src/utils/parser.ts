/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedCharacterData {
  name: string;
  share: number;
  weaponName: string;
}

interface ParsedData {
  dps: number;
  totalDamage: number;
  rotation: number;
  characters: ParsedCharacterData[];
}

export interface ParsedWuWaTeamBlock extends Partial<ParsedData> {
  teamName: string;
  characters: ParsedCharacterData[];
}

const sanitizeImportText = (text: string): string => {
  return text
    .replace(/\r/g, '')
    .replace(/Ã¢â‚¬â€|â€”|—/g, '-')
    .replace(/Ã¢â€ â€™|â†’|→/g, '->');
};

const parseValue = (value: string): number => {
  const clean = value.toLowerCase().replace(/[,%]/g, '').trim();
  const parsed = parseFloat(clean.replace(/[a-z()]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isMetricLine = (line: string): boolean =>
  /^(dps|total damage|dpr|rotation|rotation time)\s*:/i.test(line);

const extractMetricValue = (line: string): number => {
  const parts = line.split(':');
  return parseValue(parts.slice(1).join(':'));
};

const cleanupCharacterPrefix = (value: string): string => {
  return value
    .replace(/^[*\-\u2022]+\s*/, '')
    .replace(/^(character|slot|member)\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\d+\s*[:.)-]\s*/, '')
    .trim();
};

const cleanupWeaponValue = (value: string): string => {
  return value
    .replace(/^[|/\\\-:>]+/, '')
    .replace(/^weapon\s*:/i, '')
    .replace(/^sig(nature)?\s*:/i, '')
    .replace(/\([^)]*\)\s*$/, '')
    .trim();
};

const parseCharacterLine = (line: string): ParsedCharacterData | null => {
  const percentMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    const percentIndex = percentMatch.index ?? 0;
    const percentValue = parseValue(percentMatch[0]);
    const beforePercent = cleanupCharacterPrefix(line.slice(0, percentIndex).trim());
    const afterPercent = cleanupWeaponValue(line.slice(percentIndex + percentMatch[0].length).trim());

    if (beforePercent) {
      return {
        name: beforePercent,
        share: percentValue,
        weaponName: afterPercent,
      };
    }
  }

  const explicitMatch = line.match(
    /^(?:[*\-\u2022]\s*)?(?:character|slot|member)?\s*\d*\s*[:.)-]?\s*(.+?)(?:\s*[|/\\-]\s*(.+))?$/i
  );
  if (!explicitMatch) return null;

  const name = cleanupCharacterPrefix(explicitMatch[1] || '');
  const weaponName = cleanupWeaponValue(explicitMatch[2] || '');
  if (!name || isMetricLine(name) || /^weapon\s*:/i.test(name)) return null;

  return {
    name,
    share: 0,
    weaponName,
  };
};

const parseTeamBlock = (block: string, fallbackIndex: number): ParsedWuWaTeamBlock | null => {
  const lines = sanitizeImportText(block)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const result: ParsedWuWaTeamBlock = {
    teamName: '',
    characters: [],
  };

  lines.forEach((line, index) => {
    if (/^(team|team name|name|title)\s*:/i.test(line)) {
      result.teamName = line.split(':').slice(1).join(':').trim();
      return;
    }

    if (/^dps\s*:/i.test(line)) {
      result.dps = extractMetricValue(line);
      return;
    }

    if (/^(?:total damage(?:\s*\(dpr\))?|dpr)\s*:/i.test(line)) {
      result.totalDamage = extractMetricValue(line);
      return;
    }

    if (/^(?:rotation|rotation time)\s*:/i.test(line)) {
      result.rotation = extractMetricValue(line);
      return;
    }

    if (/^(?:->\s*)?weapon\s*:/i.test(line)) {
      const lastCharacter = result.characters[result.characters.length - 1];
      if (lastCharacter && !lastCharacter.weaponName) {
        lastCharacter.weaponName = cleanupWeaponValue(line);
      }
      return;
    }

    const parsedCharacter = parseCharacterLine(line);
    if (parsedCharacter) {
      result.characters.push(parsedCharacter);
      return;
    }

    if (!result.teamName && index === 0 && !isMetricLine(line)) {
      result.teamName = line;
    }
  });

  result.teamName = result.teamName || `WuWa Team ${fallbackIndex + 1}`;

  const hasMeaningfulData =
    result.characters.length > 0 ||
    result.totalDamage !== undefined ||
    result.rotation !== undefined ||
    result.teamName.trim().length > 0;

  return hasMeaningfulData ? result : null;
};

export const parseTeamData = (text: string): Partial<ParsedData> => {
  const parsed = parseTeamBlock(text, 0);
  if (!parsed) {
    return { characters: [] };
  }

  return {
    dps: parsed.dps,
    totalDamage: parsed.totalDamage,
    rotation: parsed.rotation,
    characters: parsed.characters,
  };
};

export const parseWuWaBulkImport = (text: string): ParsedWuWaTeamBlock[] => {
  const sanitized = sanitizeImportText(text);
  const blocks = sanitized
    .split(/\n\s*\n+|(?:^|\n)(?:={3,}|-{3,})(?:\n|$)/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block, index) => parseTeamBlock(block, index))
    .filter((block): block is ParsedWuWaTeamBlock => Boolean(block));
};
