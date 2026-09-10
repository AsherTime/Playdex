import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { SOURCE_URL, extractRankings, matchCharacters } from './game8.mjs';

nextEnv.loadEnvConfig(process.cwd());
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const checked = async query => { const { data, error } = await query; if (error) throw error; return data; };
const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Game8 returned ${response.status}`);
const source = extractRankings(await response.text());
const characters = await checked(db.from('game_characters').select('id,slug,display_name,portrait_url').eq('game_id', 'genshin-impact'));
const { matched, unmatched } = matchCharacters(source.entries, characters);
const missingIcons = [...new Set(matched.filter(e => {
  const character = characters.find(c => c.id === e.character_id);
  const candidates = [character?.portrait_url,
    `/assets/characters/genshin-impact/characters/${e.slug}.webp`,
    `/assets/characters/genshin-impact/characters/${e.slug.replace(/^traveler-(.+)$/, '$1-traveler')}.webp`];
  return !candidates.some(path => path?.startsWith('/assets/') && existsSync(`public${path}`));
}).map(e => e.slug))];
const report = { ...source, entries: matched, unmatched, missingIcons };
mkdirSync('reports/tier-lists', { recursive: true });
writeFileSync('reports/tier-lists/genshin-game8-seed.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ version: source.source_version, updated: source.source_updated_at,
  entries: matched.length, characters: new Set(matched.map(e => e.character_id)).size, unmatched, missingIcons }, null, 2));
if (unmatched.length) throw new Error('Unmatched characters; no data inserted.');
if (!process.argv.includes('--apply')) process.exit(0);
const existing = await checked(db.from('game_character_tier_lists').select('id').eq('game_id', 'genshin-impact').eq('slug', 'main').maybeSingle());
if (existing) { console.log('Tier list already exists; preserving all Playdex edits.'); process.exit(0); }
const id = await checked(db.rpc('seed_character_tier_list', {
  p_list: { game_id: 'genshin-impact', slug: 'main', name: 'Genshin Impact Character Tier List',
    version: source.source_version, source_url: SOURCE_URL, source_updated_at: source.source_updated_at,
    tiers: source.tiers, roles: source.roles },
  p_entries: matched.map(({ character_id, role, tier, sort_order }) => ({ character_id, role, tier, sort_order })),
}));
const actual = await checked(db.from('game_character_tier_entries').select('character_id,role,tier,sort_order').eq('tier_list_id', id));
const signature = entries => entries.map(e => `${e.character_id}|${e.role}|${e.tier}|${e.sort_order}`).sort().join('\n');
if (signature(actual) !== signature(matched)) throw new Error('Seed verification failed');
console.log(`Verified ${actual.length} entries; SSS empty; source ordering preserved.`);
