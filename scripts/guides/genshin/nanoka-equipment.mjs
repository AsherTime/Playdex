import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { parse } from 'node-html-parser';

export const GAME_ID = 'genshin-impact';
export const HOME = 'https://gi.nanoka.cc/';
const TYPES = { WEAPON_SWORD_ONE_HAND: 'Sword', WEAPON_CLAYMORE: 'Claymore', WEAPON_POLE: 'Polearm', WEAPON_CATALYST: 'Catalyst', WEAPON_BOW: 'Bow' };
const STATS = {
  FIGHT_PROP_ATTACK_PERCENT: ['ATK', 'percent'],
  FIGHT_PROP_DEFENSE_PERCENT: ['DEF', 'percent'],
  FIGHT_PROP_HP_PERCENT: ['HP', 'percent'],
  FIGHT_PROP_CRITICAL: ['CRIT Rate', 'percent'],
  FIGHT_PROP_CRITICAL_HURT: ['CRIT DMG', 'percent'],
  FIGHT_PROP_CHARGE_EFFICIENCY: ['Energy Recharge', 'percent'],
  FIGHT_PROP_PHYSICAL_ADD_HURT: ['Physical DMG Bonus', 'percent'],
  FIGHT_PROP_ELEMENT_MASTERY: ['Elemental Mastery', 'flat'],
};

export const slugify = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/['\u2019`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function cleanText(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.replace(/(?:\{LAYOUT_(?:MOBILE|PC|PS)#[^}]*\})+/g, (group) => {
    const entries = [...group.matchAll(/\{LAYOUT_(MOBILE|PC|PS)#([^}]*)\}/g)];
    return (entries.find((x) => x[1] === 'PC') ?? entries[0])?.[2] ?? '';
  }).replace(/\\n/g, '\n').replace(/<\/?color[^>]*>/g, '').replace(/^#(?=\S)/gm, '');
  return parse(`<div>${text}</div>`).structuredText.replace(/\u00a0/g, ' ').trim() || null;
}

export async function fetchNanoka(url, { json = true, method = 'GET' } = {}) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['gi.nanoka.cc', 'static.nanoka.cc'].includes(parsed.hostname)) throw new Error('Non-Nanoka source rejected');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'PlaydexGuideImporter/1.0', accept: json ? 'application/json' : '*/*' } });
      if (!response.ok) throw Object.assign(new Error(`Nanoka HTTP ${response.status}: ${url}`), { status: response.status });
      if (method === 'HEAD') return response.headers.get('content-type')?.startsWith('image/') ?? false;
      return await (json ? response.json() : response.text());
    } catch (error) {
      if (attempt === 2 || [403, 404].includes(error.status)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

export async function discoverVersion() {
  // Same version discovery as the existing character-kit importer.
  const html = await fetchNanoka(HOME, { json: false });
  const version = html.match(/https:\/\/static\.nanoka\.cc\/gi\/([^/]+)\/character\.json/)?.[1];
  if (!version) throw new Error('Could not discover Nanoka structured data version');
  return version;
}

export function indexAssets(kind, root = process.cwd()) {
  const folder = join(root, 'public', 'assets', 'characters', GAME_ID, kind);
  const index = new Map();
  if (!existsSync(folder)) return index;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(webp|png|jpe?g|svg)$/i.test(entry.name)) continue;
    const key = slugify(basename(entry.name, extname(entry.name)));
    index.set(key, `/assets/characters/${GAME_ID}/${kind}/${entry.name}`);
  }
  return index;
}

export async function resolveIcon(index, name, iconKey) {
  for (const candidate of [name, iconKey]) {
    const local = index.get(slugify(candidate));
    if (local) return { url: local, origin: 'local' };
  }
  if (typeof iconKey === 'string' && /^[A-Za-z0-9_]+$/.test(iconKey)) {
    const url = `https://static.nanoka.cc/assets/gi/${iconKey}.webp`;
    try {
      if (await fetchNanoka(url, { method: 'HEAD', json: false })) return { url, origin: 'nanoka' };
    } catch { /* A missing image must not prevent canonical text import. */ }
  }
  return { url: null, origin: 'missing' };
}

function common(id, name, kind, version, data, iconUrl) {
  if (!name) throw new Error(`Missing ${kind} name for ${id}`);
  return { game_id: GAME_ID, source_id: String(id), slug: slugify(name) || String(id), name,
    icon_url: iconUrl, icon_key: data.icon ?? null, source_site: 'nanoka',
    source_url: `${HOME}${kind}/${id}`, source_data_url: `https://static.nanoka.cc/gi/${version}/en/${kind}/${id}.json`,
    source_version: version, raw_data: data, content_hash: hash(data), last_checked_at: new Date().toISOString() };
}

export function normalizeWeapon(id, data, version, iconUrl = null) {
  if (!data || typeof data !== 'object') throw new Error('Invalid weapon JSON');
  const base = (data.weapon_prop ?? []).find((x) => x.prop_type === 'FIGHT_PROP_BASE_ATTACK');
  const secondary = (data.weapon_prop ?? []).filter((x) => !['FIGHT_PROP_BASE_ATTACK', 'FIGHT_PROP_NONE'].includes(x.prop_type));
  if (secondary.length > 1) throw new Error(`Multiple secondary stats for ${id}; schema needs explicit mapping`);
  const stat = secondary[0];
  const [statName, unit] = stat ? STATS[stat.prop_type] ?? [stat.prop_type, 'raw'] : [null, null];
  const rawValue = number(stat?.init_value);
  const refinements = Object.entries(data.refinement ?? {}).map(([rank, item]) => ({
    rank: Number(rank), name: cleanText(item.name), description: cleanText(item.desc), values: item.param_list ?? null,
  })).sort((a, b) => a.rank - b.rank);
  const first = refinements.find((item) => item.rank === 1);
  const row = { ...common(id, cleanText(data.name), 'weapon', version, data, iconUrl),
    weapon_type: TYPES[data.weapon_type] ?? data.weapon_type ?? null, weapon_type_code: data.weapon_type ?? null,
    rarity: number(data.rarity), base_atk: number(base?.init_value), stat_level: 1,
    secondary_stat_name: statName, secondary_stat_code: stat?.prop_type ?? null,
    secondary_stat_raw_value: rawValue, secondary_stat_unit: unit,
    secondary_stat_value: rawValue === null ? null : Number((rawValue * (unit === 'percent' ? 100 : 1)).toPrecision(12)),
    passive_name: first?.name ?? null, passive_description: first?.description ?? null, refinement_values: refinements,
    stat_progression: { modifiers: data.stats_modifier ?? null, ascension: data.ascension ?? null },
  };
  row.missing_fields = ['icon_url', 'base_atk', 'secondary_stat_name', 'secondary_stat_value', 'passive_name', 'passive_description'].filter((key) => row[key] === null);
  return row;
}

export function normalizeArtifact(id, data, version, iconUrl = null) {
  if (!Array.isArray(data?.affix) || !Array.isArray(data?.need) || data.affix.length !== data.need.length) throw new Error(`Unmatched artifact thresholds/effects for ${id}`);
  const effects = data.affix.map((item, index) => ({ pieces: number(data.need[index]),
    name: cleanText(item.name), description: cleanText(item.desc), source_effect_id: item.affix_id ?? null,
    values: item.param_list ?? null, add_props: item.add_props ?? null }));
  if (effects.some((x) => x.pieces === null)) throw new Error(`Missing piece threshold for ${id}`);
  const row = { ...common(id, effects.find((x) => x.name)?.name, 'artifact', version, data, iconUrl),
    rarities: Array.isArray(data.rank) ? data.rank : null,
    two_piece_bonus: effects.find((x) => x.pieces === 2)?.description ?? null,
    four_piece_bonus: effects.find((x) => x.pieces === 4)?.description ?? null,
    additional_effects: effects.filter((x) => ![2, 4].includes(x.pieces)), set_effects: effects,
  };
  row.missing_fields = ['icon_url', 'rarities', 'two_piece_bonus', 'four_piece_bonus'].filter((key) => row[key] === null);
  return row;
}

function canonicalRecord(row) {
  const { game_id, source_id, source_site, slug, name, icon_url, source_url, source_data_url,
    source_version, raw_data, content_hash, last_checked_at } = row;
  return { game_id, source_id, source_site, slug, name, icon_url, source_url, source_data_url,
    source_version, raw_data, content_hash, last_checked_at,
    metadata: { icon_key: row.icon_key, missing_fields: row.missing_fields } };
}

export function genericWeapon(row) {
  const record = { ...canonicalRecord(row), equipment_category: 'weapon',
    equipment_type: row.weapon_type?.toLowerCase().replaceAll(' ', '_') ?? null, rarity: row.rarity };
  record.metadata.progression = row.stat_progression;
  record.metadata.rank_terminology = 'refinement';
  record.metadata.source_type_code = row.weapon_type_code;
  const stats = [];
  for (const [modifierKey, modifier] of Object.entries(row.raw_data.stats_modifier ?? {})) {
    if (modifierKey === 'fight_prop_none') continue;
    const key = modifierKey === 'atk' ? 'base_attack' : modifierKey.replace(/^fight_prop_/, '');
    const unit = modifierKey === 'atk' ? 'flat' : row.secondary_stat_unit ?? 'raw';
    if (number(modifier.base) === null) throw new Error(`Missing base for ${modifierKey}`);
    for (const [level, multiplier] of Object.entries(modifier.levels ?? {})) {
      if (number(multiplier) === null || !Number.isInteger(Number(level))) throw new Error('Invalid source curve');
      const value = Number((modifier.base * multiplier).toFixed(10));
      stats.push({ stat_key: key, stat_name: modifierKey === 'atk' ? 'ATK' : row.secondary_stat_name ?? key,
        value, display_value: String(Number((value * (unit === 'percent' ? 100 : 1)).toFixed(8))) + (unit === 'percent' ? '%' : ''),
        level: Number(level), ascension: null, sort_order: modifierKey === 'atk' ? 0 : 1,
        metadata: { component: 'level_curve', source_modifier: modifierKey, unit } });
    }
  }
  for (const [ascension, properties] of Object.entries(row.raw_data.ascension ?? {})) {
    for (const [property, value] of Object.entries(properties)) {
      if (number(value) === null) throw new Error('Invalid ascension value');
      stats.push({ stat_key: property.replace(/^fight_prop_/, ''), stat_name: 'Ascension bonus',
        value, display_value: String(value), level: null, ascension: Number(ascension), sort_order: 2,
        metadata: { component: 'ascension_bonus', source_property: property } });
    }
  }
  const effects = row.refinement_values.map((r) => ({ effect_type: 'passive', effect_key: 'main',
    name: r.name, rank: r.rank, description: r.description, parameters: { values: r.values }, sort_order: r.rank, metadata: {} }));
  return { record, children: stats, effects };
}

export function genericArtifact(row) {
  return { record: { ...canonicalRecord(row), set_category: 'artifact', rarities: row.rarities },
    children: row.set_effects.map((effect, index) => ({ pieces_required: effect.pieces,
      effect_key: String(effect.source_effect_id ?? index + 1), description: effect.description,
      parameters: { values: effect.values, add_props: effect.add_props }, sort_order: index,
      metadata: { name: effect.name } })), effects: [] };
}
