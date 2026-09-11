import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createWeaponResolver } from './resolve-calculation-weapon.mjs';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const checked = r => { if (r.error) throw r.error; return r.data; };
async function all(table, configure = q => q) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const batch = checked(await configure(db.from(table).select('*')).range(from, from + 499));
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
const equipment = await all('game_equipment', q => q.eq('game_id', 'genshin-impact').eq('equipment_category', 'weapon').order('id'));
const characters = await all('game_characters', q => q.eq('game_id', 'genshin-impact').order('id'));
const teams = await all('team_damage_calculations', q => q.eq('game_id', 'genshin-impact').order('id'));
const teamIds = new Set(teams.map(t => t.id));
const members = (await all('team_damage_calculation_members', q => q.order('calculation_id').order('slot'))).filter(m => teamIds.has(m.calculation_id));
const resolve = createWeaponResolver(equipment);
for (const [slug, expected] of [['bennett', 'Favonius Sword'], ['charlotte', 'Favonius Codex'], ['yelan', 'Favonius Warbow']]) {
  const character = characters.find(c => c.slug === slug);
  assert.ok(character?.weapon_type, `Missing weapon type for ${slug}`);
  assert.equal(resolve('Favonius', character.weapon_type).weapon?.name, expected);
}
const report = { total: members.length, exact: 0, alias: 0, partial: 0, weapon_type_assisted: 0, fuzzy: 0, unresolved: 0, updates: 0, failures: [], matches: [] };
const snapshot = JSON.parse(await readFile('reports/team-calculations/source-snapshot.json', 'utf8'));
const exportFile = 'D:/Team graphic genshin/outputs/team-calculations-export/genshin-wuwa-team-calculations.xlsx';
assert.equal(createHash('sha256').update(await readFile(exportFile)).digest('hex'), snapshot.source_sha256, 'Export changed; regenerate source snapshot first');
for (const [raw, type, expected] of [
  ['Etherlight', 'catalyst', 'Etherlight Spindlelute'], ['Spindlelute', 'catalyst', 'Etherlight Spindlelute'],
  ['etherligh', 'catalyst', 'Etherlight Spindlelute'],
  ['Favonius', 'sword', 'Favonius Sword'], ['Favonius', 'catalyst', 'Favonius Codex'],
  ['Favonius', 'bow', 'Favonius Warbow'], ['Favonius', 'claymore', 'Favonius Greatsword'], ['Favonius', 'polearm', 'Favonius Lance'],
]) assert.equal(resolve(raw, type).weapon?.name, expected);
for (const weapon of equipment) assert.equal(resolve(weapon.name, weapon.equipment_type).weapon?.id, weapon.id);
assert.equal(resolve('Favonius', null).weapon, null);
assert.equal(resolve('Etherlight', 'sword').weapon, null);
assert.equal(resolve('etherligh', 'bow').weapon, null);
assert.equal(resolve('a', 'sword').weapon, null);
for (const member of members) {
  const character = characters.find(c => c.id === member.character_id);
  const result = resolve(member.weapon_name, character?.weapon_type);
  report[result.method]++;
  const record = { calculation: member.calculation_id, team: teams.find(t => t.id === member.calculation_id)?.team_name, slot: member.slot, raw: member.weapon_name, character: character?.name, weapon_type: character?.weapon_type, method: result.method, canonical: result.weapon?.name ?? null, candidates: result.candidates, reason: result.reason };
  (result.weapon ? report.matches : report.failures).push(record);
  if (result.weapon?.icon_url?.startsWith('/')) await access(`public${result.weapon.icon_url}`);
  const id = result.weapon?.id ?? null;
  if (id !== member.equipment_id) {
    report.updates++;
    if (process.argv.includes('--write')) {
      const saved = checked(await db.from('team_damage_calculation_members').update({ equipment_id: id })
        .eq('calculation_id', member.calculation_id).eq('slot', member.slot).select('*').single());
      assert.deepEqual(saved, { ...member, equipment_id: id }, 'Non-weapon data changed');
    }
  }
}
const after = (await all('team_damage_calculation_members', q => q.order('calculation_id').order('slot'))).filter(m => teamIds.has(m.calculation_id));
const withoutIdentity = rows => rows.map(({ equipment_id, ...rest }) => rest);
assert.deepEqual(withoutIdentity(after), withoutIdentity(members));
assert.deepEqual(await all('team_damage_calculations', q => q.eq('game_id', 'genshin-impact').order('id')), teams);
if (process.argv.includes('--write')) for (const m of after) assert.equal(m.equipment_id, resolve(m.weapon_name, characters.find(c => c.id === m.character_id)?.weapon_type).weapon?.id ?? null);
report.verified = ['Actual workbook SHA256 matches parsed snapshot', 'All canonical full names', 'Five Favonius weapon types', 'Etherlight partial and typo', 'Cross-type rejection', 'All local resolved icons exist', 'All non-identity fields unchanged'];
await mkdir('reports/team-calculations', { recursive: true });
await writeFile('reports/team-calculations/weapon-resolution.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, matches: undefined, failures: [...new Set(report.failures.map(r => r.raw))] }, null, 2));
