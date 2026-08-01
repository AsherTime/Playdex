/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WuWaElementType } from '../types';

export const WUWA_CHARACTER_ASSET_FILES = [
  'Aalto.png',
  'Aemeath.png',
  'Augusta.png',
  'Baizhi.png',
  'Brant.png',
  'Buling.png',
  'Calcharo.png',
  'Camellya.png',
  'Cantarella.png',
  'Carlotta.png',
  'Cartethyia.png',
  'Changli.png',
  'Chisa.png',
  'Chixia.png',
  'Ciaccona.png',
  'Danjin.png',
  'Denia.png',
  'Encore.png',
  'Galbrena.png',
  'Hiyuki.png',
  'Iuno.png',
  'Jianxin.png',
  'Jinhsi.png',
  'Jiyan.png',
  'Lingyang.png',
  'Lumi.png',
  'Lupa.png',
  'Luuk Herssen.png',
  'Lucilla.webp',
  'Lucy.webp',
  'Lynae.png',
  'Mornye.png',
  'Mortefi.png',
  'Phoebe.png',
  'Phrolova.png',
  'Qiuyuan.png',
  'Rebecca.webp',
  'Roccia.png',
  'Rover Aero (1).png',
  'Rover Aero.png',
  'Rover Havoc (1).png',
  'Rover Havoc.png',
  'Rover Spectro (1).png',
  'Rover Spectro.png',
  'Sanhua.png',
  'Shorekeeper.png',
  'Sigrika.png',
  'Taoqi.png',
  'Verina.png',
  'Xiangli Yao.png',
  'Yangyang.png',
  'Yinlin.png',
  'Youhu.png',
  'Yuanwu.png',
  'Zani.png',
  'Zhezhi.png',
] as const;

export const WUWA_WEAPON_ASSET_FILES = [
  'Abyss Surges.png',
  'Aether Strike.png',
  'Ages of Harvest.png',
  'Amity Accord.png',
  'Augment.png',
  'Aureate Zenith.png',
  'Autumntrace.png',
  'Beguiling Melody.png',
  'Blazing Brilliance.png',
  'Blazing Justice.png',
  "Bloodpact's Pledge.png",
  'Boson Astrolabe.png',
  'Broadblade of Night.png',
  'Broadblade of Voyager.png',
  'Broadblade#41.png',
  'Cadenza.png',
  'Call of the Abyss.png',
  'Celestial Spiral.png',
  'Comet Flare.png',
  'Commando of Conviction.png',
  'Cosmic Ripples.png',
  'Dauntless Evernight.png',
  "Daybreaker's Spine.png",
  "Defier's Thorn.png",
  'Discord.png',
  'Emerald of Genesis.png',
  'Emerald Sentence.png',
  'Endless Collapse.png',
  'Everbright Polestar.png',
  'Fables of Wisdom.png',
  'Feather Edge.png',
  'Forged Dwarf Star.png',
  'Freeze Frame.webp',
  'Frostburn.png',
  'Fusion Accretion.png',
  'Gauntlets of Night.png',
  'Gauntlets of Voyager.png',
  'Gauntlets#21D.png',
  'Guardian Broadblade.png',
  'Guardian Gauntlets.png',
  'Guardian Pistols.png',
  'Guardian Rectifier.png',
  'Guardian Sword.png',
  'Helios Cleaver.png',
  'Hollow Mirage.png',
  'Jinzhou Keeper.png',
  'Kumokiri.png',
  'Laser Shearer.png',
  'Legend of Drunken Hero.png',
  'Lethean Elegy.png',
  'Lumingloss.png',
  'Luminous Hymn.png',
  'Lunar Cutter.png',
  'Lustrous Razor.png',
  'Lux & Umbra.png',
  'Marcato.png',
  'Meditations on Mercy.png',
  "Moongazer's Sigil.png",
  'Novaburst.png',
  "Ocean's Gift.png",
  'Originite Type I.png',
  'Originite Type II.png',
  'Originite Type III.png',
  'Originite Type IV.png',
  'Originite Type V.png',
  'Overture.png',
  'Phasic Homogenizer.png',
  'Pistols of Night.png',
  'Pistols of Voyager.png',
  'Pistols#26.png',
  'Pulsation Bracer.png',
  'Radiance Cleaver.png',
  'Radiant Dawn.png',
  'Rectifier of Night.png',
  'Rectifier of Voyager.png',
  'Rectifier#25.png',
  'Red Spring.png',
  'Relativistic Jet.png',
  'Rime-Draped Sprouts.png',
  'Romance in Farewell.png',
  'Solar Flame.png',
  'Solsworn Ciphers.png',
  'Somnoire Anchor.png',
  'Spectrum Blaster.png',
  'Spectral Trigger.png',
  'Starfield Calibrator.png',
  'Static Mist.png',
  'Stellar Symphony.png',
  'Stonard.png',
  'Stringmaster.png',
  'Skull Thrasher.png',
  'Sword of Night.png',
  'Sword of Voyager.png',
  'Sword#18.png',
  'The Last Dance.png',
  'Thunderbolt.png',
  'Thunderflare Dominion.png',
  'Tragicomedy.png',
  'Training Broadblade.png',
  'Training Gauntlets.png',
  'Training Pistols.png',
  'Training Rectifier.png',
  'Training Sword.png',
  'Tyro Broadblade.png',
  'Tyro Gauntlets.png',
  'Tyro Pistols.png',
  'Tyro Rectifier.png',
  'Tyro Sword.png',
  'Undying Flame.png',
  'Unflickering Valor.png',
  'Variation.png',
  'Verdant Summit.png',
  "Verity's Handle.png",
  'Waltz in Masquerade.png',
  'Waning Redshift.png',
  'Whispers of Sirens.png',
  'Wildfire Mark.png',
  'Woodland Aria.png',
] as const;

export const WUWA_CHARACTER_ELEMENT_MAP: Record<string, WuWaElementType> = {
  Jiyan: 'Aero',
  Jianxin: 'Aero',
  'Rover (Aero)': 'Aero',
  Cartethyia: 'Aero',
  Iuno: 'Aero',
  Qiuyuan: 'Aero',
  Sigrika: 'Aero',
  Yangyang: 'Aero',
  Aalto: 'Aero',
  Lingyang: 'Glacio',
  Zhezhi: 'Glacio',
  Carlotta: 'Glacio',
  Hiyuki: 'Glacio',
  Lucilla: 'Glacio',
  Baizhi: 'Glacio',
  Sanhua: 'Glacio',
  Youhu: 'Glacio',
  Encore: 'Fusion',
  Changli: 'Fusion',
  Brant: 'Fusion',
  Lupa: 'Fusion',
  Galbrena: 'Fusion',
  Mornye: 'Fusion',
  Aemeath: 'Fusion',
  Denia: 'Fusion',
  Chixia: 'Fusion',
  Mortefi: 'Fusion',
  Calcharo: 'Electro',
  Yinlin: 'Electro',
  'Xiangli Yao': 'Electro',
  Augusta: 'Electro',
  Rebecca: 'Electro',
  Yuanwu: 'Electro',
  Lumi: 'Electro',
  Buling: 'Electro',
  Verina: 'Spectro',
  'Rover (Spectro)': 'Spectro',
  Jinhsi: 'Spectro',
  Shorekeeper: 'Spectro',
  Phoebe: 'Spectro',
  Zani: 'Spectro',
  Lucy: 'Spectro',
  Lynae: 'Spectro',
  'Luuk Herssen': 'Spectro',
  'Rover (Havoc)': 'Havoc',
  Camellya: 'Havoc',
  Roccia: 'Havoc',
  Cantarella: 'Havoc',
  Phrolova: 'Havoc',
  Chisa: 'Havoc',
  Taoqi: 'Havoc',
  Danjin: 'Havoc',
};

export const WUWA_SIGNATURE_WEAPON_MAP: Record<string, string> = {
  Aemeath: 'Everbright Polestar',
  Augusta: 'Thunderflare Dominion',
  Brant: 'Unflickering Valor',
  Camellya: 'Red Spring',
  Cantarella: 'Whispers of Sirens',
  Carlotta: 'The Last Dance',
  Cartethyia: "Defier's Thorn",
  Changli: 'Blazing Brilliance',
  Chisa: 'Kumokiri',
  Ciaccona: 'Woodland Aria',
  Denia: 'Forged Dwarf Star',
  Galbrena: 'Lux & Umbra',
  Iuno: "Moongazer's Sigil",
  Jinhsi: 'Ages of Harvest',
  Jiyan: 'Verdant Summit',
  Lupa: 'Wildfire Mark',
  'Luuk Herssen': "Daybreaker's Spine",
  Lucilla: 'Freeze Frame',
  Lucy: 'Spectral Trigger',
  Lynae: 'Spectrum Blaster',
  Mornye: 'Starfield Calibrator',
  Phoebe: 'Luminous Hymn',
  Phrolova: 'Lethean Elegy',
  Qiuyuan: 'Emerald Sentence',
  Rebecca: 'Skull Thrasher',
  Roccia: 'Tragicomedy',
  Sigrika: 'Solsworn Ciphers',
  'The Shorekeeper': 'Stellar Symphony',
  'Xiangli Yao': "Verity's Handle",
  Yinlin: 'Stringmaster',
  Zani: 'Blazing Justice',
  Zhezhi: 'Rime-Draped Sprouts',
};

const normalizeWuWaName = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[()#]/g, ' ')
    .replace(/['.]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toTokenStem = (token: string): string => {
  if (token.length > 3 && token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
};

const tokenize = (value: string): string[] =>
  normalizeWuWaName(value)
    .split(' ')
    .map(toTokenStem)
    .filter(Boolean);

const makeBigrams = (value: string): string[] => {
  const normalized = normalizeWuWaName(value).replace(/\s+/g, '');
  if (normalized.length <= 1) return [normalized];
  const result: string[] = [];
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.push(normalized.slice(index, index + 2));
  }
  return result;
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

const tokenOverlapScore = (left: string[], right: string[]): number => {
  if (!left.length || !right.length) return 0;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let overlap = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      overlap += 1;
    }
  });
  return overlap / Math.max(leftSet.size, rightSet.size);
};

const canonicalAliases: Record<string, string[]> = {
  'Rover (Aero)': ['rover aero', 'aero rover'],
  'Rover (Spectro)': ['rover spectro', 'spectro rover'],
  'Rover (Havoc)': ['rover havoc', 'havoc rover'],
  Shorekeeper: ['the shorekeeper'],
  'Xiangli Yao': ['xiangliyao'],
};

const wuwaLookupEntries = Object.entries(WUWA_CHARACTER_ELEMENT_MAP).map(([canonicalName, element]) => {
  const aliases = canonicalAliases[canonicalName] || [];
  return {
    canonicalName,
    element,
    aliases,
    normalized: normalizeWuWaName(canonicalName),
    tokens: tokenize(canonicalName),
  };
});

const exactLookup = new Map<string, { canonicalName: string; element: WuWaElementType }>();

wuwaLookupEntries.forEach((entry) => {
  exactLookup.set(entry.normalized, {
    canonicalName: entry.canonicalName,
    element: entry.element,
  });
  entry.aliases.forEach((alias) => {
    exactLookup.set(normalizeWuWaName(alias), {
      canonicalName: entry.canonicalName,
      element: entry.element,
    });
  });
});

const signatureWeaponLookup = new Map<string, string>();

Object.entries(WUWA_SIGNATURE_WEAPON_MAP).forEach(([characterName, weaponName]) => {
  signatureWeaponLookup.set(normalizeWuWaName(characterName), weaponName);
  const definition = exactLookup.get(normalizeWuWaName(characterName));
  if (definition) {
    signatureWeaponLookup.set(normalizeWuWaName(definition.canonicalName), weaponName);
  }
});

export const getWuWaCharacterDefinition = (
  name: string
): { canonicalName: string; element: WuWaElementType } | null => {
  if (!name.trim()) return null;

  const normalized = normalizeWuWaName(name);
  const exact = exactLookup.get(normalized);
  if (exact) return exact;

  const inputTokens = tokenize(name);
  let bestMatch: { canonicalName: string; element: WuWaElementType; score: number } | null = null;

  wuwaLookupEntries.forEach((entry) => {
    const tokenScore = tokenOverlapScore(inputTokens, entry.tokens);
    const similarity = diceSimilarity(normalized, entry.normalized);
    const score = Math.max(tokenScore * 0.6 + similarity * 0.4, similarity);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        canonicalName: entry.canonicalName,
        element: entry.element,
        score,
      };
    }
  });

  if (bestMatch && bestMatch.score >= 0.9) {
    return {
      canonicalName: bestMatch.canonicalName,
      element: bestMatch.element,
    };
  }

  return null;
};

export const getWuWaCharacterElement = (name: string): WuWaElementType | null => {
  return getWuWaCharacterDefinition(name)?.element ?? null;
};

export const getWuWaSignatureWeapon = (name: string): string | null => {
  if (!name.trim()) return null;

  const directMatch = signatureWeaponLookup.get(normalizeWuWaName(name));
  if (directMatch) return directMatch;

  const characterDefinition = getWuWaCharacterDefinition(name);
  if (!characterDefinition) return null;

  return signatureWeaponLookup.get(normalizeWuWaName(characterDefinition.canonicalName)) ?? null;
};
