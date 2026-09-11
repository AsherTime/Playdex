import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeaponResolver, normalizeWeaponName } from './resolve-calculation-weapon.mjs';
const weapon = (name, type, extra = {}) => ({ id: name, name, game_id: 'genshin-impact', equipment_category: 'weapon', equipment_type: type, ...extra });
const rows = [weapon('Etherlight Spindlelute', 'catalyst'), weapon('Favonius Sword', 'sword'), weapon('Favonius Codex', 'catalyst'), weapon('Favonius Warbow', 'bow')];
const resolve = createWeaponResolver(rows);
test('normalizes export decorations and punctuation', () => {
  assert.equal(normalizeWeaponName(' Weapon:  Lion\u2019s\u2014Roar R5 '), 'lions roar');
});
test('exact, partial, and type-assisted identity', () => {
  assert.equal(resolve('Etherlight Spindlelute', 'Catalyst').method, 'exact');
  for (const raw of ['Etherlight', 'Spindlelute']) assert.equal(resolve(raw, 'catalyst').weapon.name, 'Etherlight Spindlelute');
  for (const row of rows.filter(r => r.name.startsWith('Favonius'))) assert.equal(resolve('Favonius', row.equipment_type).weapon.id, row.id);
  assert.equal(resolve('Favonius', null).weapon, null);
});
test('aliases reuse canonical metadata', () => {
  assert.equal(createWeaponResolver([weapon('Example Weapon', 'sword', { metadata: { aliases: ['Test Alias'] } })])('Test Alias', 'sword').method, 'alias');
});
test('fuzzy requires a weapon type and a clear winner', () => {
  assert.equal(resolve('etherligt', 'catalyst').method, 'fuzzy');
  assert.equal(resolve('etherligt', null).weapon, null);
  assert.equal(resolve('etherligt', 'sword').weapon, null);
  const ambiguous = createWeaponResolver([...rows, weapon('Etherlights Lute', 'catalyst')]);
  assert.equal(ambiguous('etherligh', 'catalyst').weapon, null);
});
test('rejects cross-type, cross-game and weak matches', () => {
  assert.equal(resolve('Etherlight Spindlelute', 'sword').weapon, null);
  assert.equal(resolve('Etherlight', 'bow').weapon, null);
  for (const raw of ['', 'a', 'of', 'Gacha Sword']) assert.equal(resolve(raw, 'sword').weapon, null);
  assert.equal(createWeaponResolver([weapon('Other', 'sword', { game_id: 'other-game' })])('Other', 'sword').weapon, null);
});
