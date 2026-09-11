import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { createWeaponResolver } from './resolve-calculation-weapon.mjs';

const folder = 'reports/team-calculations';
const snapshot = JSON.parse(await readFile(`${folder}/source-snapshot.json`, 'utf8'));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const publicDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const source = 'team-calculations-workbook';
function checked(result) {
  if (result.error) throw result.error;
  return result.data;
}
function normalize(value) {
  return value.toLowerCase().replace(/\b[cr]\d+(?:r\d+)?\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
const aliases = { bennet: 'bennett', kuki: 'kuki shinobu', mizuki: 'yumemizuki mizuki', yae: 'yae miko' };
const roster = checked(await db.from('game_characters').select('id,slug,name,display_name,element,weapon_type').eq('game_id', 'genshin-impact'));
const resolveWeapon = createWeaponResolver(checked(await db.from('game_equipment').select('id,game_id,equipment_category,equipment_type,name,slug,metadata').eq('game_id', 'genshin-impact').eq('equipment_category', 'weapon')));
function match(member) {
  let key = normalize(member.character_name);
  if (key === 'traveler') key = `${member.element.toLowerCase()} traveler`;
  key = aliases[key] ?? key;
  const found = roster.filter(character => [character.slug, character.name, character.display_name,
    character.slug.startsWith('traveler-') ? `${character.element} traveler` : character.name,
  ].some(name => normalize(name) === key));
  return found.length === 1 ? found[0] : null;
}
const unmatched = snapshot.members.filter(member => !match(member)).map(member => ({ team_id: member.team_id, name: member.character_name }));
await writeFile(`${folder}/unmatched-characters.json`, JSON.stringify(unmatched, null, 2));
assert.equal(unmatched.length, 0, 'Unmatched characters reported; no calculations have been written.');
assert.equal(new Set(snapshot.teams.map(team => team.team_id)).size, snapshot.teams.length);
for (const team of snapshot.teams) {
  const members = snapshot.members.filter(member => member.team_id === team.team_id);
  assert.deepEqual(members.map(member => member.slot).sort(), [1, 2, 3, 4]);
  assert.equal(new Set(members.map(member => match(member).id)).size, 4);
  assert.equal(team.game_type, 'genshin');
}
const scale = (value, factor) => value === null ? null : value * factor;
const teams = snapshot.teams.map(team => ({
  id: team.team_id, game_id: 'genshin-impact', source, source_id: team.team_id,
  team_name: team.team_name, team_dps: scale(team.stored_dps_k, 1000),
  dpr: scale(team.total_damage_m, 1_000_000), rotation_seconds: team.rotation_seconds,
  details: { ...team, workbook_sha256: snapshot.source_sha256 },
}));
const members = snapshot.members.map(member => ({
  calculation_id: member.team_id, slot: member.slot, character_id: match(member).id,
  character_name: member.character_name, weapon_name: member.weapon_name,
  equipment_id: resolveWeapon(member.weapon_name, match(member).weapon_type).weapon?.id ?? null,
  role: member.role, element: member.element,
  damage: scale(member.source_damage_m, 1_000_000), damage_share: member.share_pct,
  details: member,
}));
if (process.argv.includes('--write')) {
  checked(await db.from('team_damage_calculations').upsert(teams, { onConflict: 'id' }));
  checked(await db.from('team_damage_calculation_members').upsert(members, { onConflict: 'calculation_id,slot' }));
}
const savedTeams = checked(await publicDb.from('team_damage_calculations').select('*').eq('source', source).eq('game_id', 'genshin-impact'));
const savedMembers = checked(await publicDb.from('team_damage_calculation_members').select('*').in('calculation_id', teams.map(team => team.id)));
assert.equal(savedTeams.length, teams.length);
assert.equal(savedMembers.length, members.length);
for (const expected of teams) assert.deepEqual(savedTeams.find(row => row.id === expected.id), expected);
for (const expected of members) assert.deepEqual(savedMembers.find(row => row.calculation_id === expected.calculation_id && row.slot === expected.slot), expected);

// Exercise the same membership-first query as the guide loader, using public access.
async function guideTeams(characterId) {
  const memberships = checked(await publicDb.from('team_damage_calculation_members').select('calculation_id').eq('character_id', characterId));
  if (!memberships.length) return [];
  return checked(await publicDb.from('team_damage_calculations').select('*').eq('game_id', 'genshin-impact').in('id', memberships.map(row => row.calculation_id)).order('team_dps', { ascending: false, nullsFirst: false }));
}
const mavuika = roster.find(character => character.slug === 'mavuika');
const mavuikaTeams = await guideTeams(mavuika.id);
assert.ok(mavuikaTeams.length);
assert.ok(mavuikaTeams.every(team => savedMembers.some(member => member.calculation_id === team.id && member.character_id === mavuika.id)));
const example = mavuikaTeams.find(team => savedMembers.filter(member => member.calculation_id === team.id).some(member => roster.find(character => character.id === member.character_id)?.slug === 'bennett'));
assert.ok(example, 'Expected a Mavuika/Bennett example');
const exampleMembers = savedMembers.filter(member => member.calculation_id === example.id).sort((a, b) => a.slot - b.slot);
const guides = [];
for (const member of exampleMembers) {
  const character = roster.find(row => row.id === member.character_id);
  const found = (await guideTeams(character.id)).find(team => team.id === example.id);
  assert.deepEqual(found, example);
  guides.push({ character: character.display_name, slug: character.slug, character_id: character.id });
}
const weaponResolutions = members.map(member => {
  const character = roster.find(c => c.id === member.character_id);
  const { weapon, ...resolution } = resolveWeapon(member.weapon_name, character.weapon_type);
  return { calculation: member.calculation_id, slot: member.slot, raw: member.weapon_name,
    character: character.name, weapon_type: character.weapon_type, equipment_id: weapon?.id ?? null,
    canonical: weapon?.name ?? null, ...resolution };
});
const unresolvedWeaponLabels = weaponResolutions.filter(r => !r.equipment_id);
await writeFile(`${folder}/import-weapon-resolution.json`, JSON.stringify(weaponResolutions, null, 2));
const report = { uniqueTeams: savedTeams.length, relationships: savedMembers.length, unmatchedCharacters: unmatched,
  explicitMemberDamageCount: members.filter(member => member.damage !== null).length,
  unresolvedWeaponLabels, example: { id: example.id, name: example.team_name, guides },
  verified: ['All source fields preserved', 'Public reads and all four memberships', 'Mavuika membership only', 'Bennett shares identical team', 'Descending stored DPS ordering'] };
await writeFile(`${folder}/verification.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
