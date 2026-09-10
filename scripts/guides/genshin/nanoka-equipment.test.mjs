import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWeapon, normalizeArtifact, cleanText, resolveIcon, genericWeapon, genericArtifact } from './nanoka-equipment.mjs';

test('preserves source level-1 values and each refinement', () => {
  const row = normalizeWeapon('13501', { name: 'Staff of Homa', weapon_type: 'WEAPON_POLE', rarity: 5,
    weapon_prop: [{ prop_type: 'FIGHT_PROP_BASE_ATTACK', init_value: 45.9364 }, { prop_type: 'FIGHT_PROP_CRITICAL_HURT', init_value: 0.144 }],
    refinement: { 1: { name: 'Reckless Cinnabar', desc: '<color=#fff>20%</color>', param_list: [0.2] }, 5: { name: 'Reckless Cinnabar', desc: '40%', param_list: [0.4] } } }, 'test');
  assert.equal(row.base_atk, 45.9364);
  assert.equal(row.secondary_stat_value, 14.4);
  assert.equal(row.secondary_stat_raw_value, 0.144);
  assert.equal(row.stat_level, 1);
  assert.equal(row.passive_description, '20%');
  assert.deepEqual(row.refinement_values.map((x) => x.rank), [1, 5]);
});
test('missing properties remain null; NONE is not a secondary stat', () => {
  const row = normalizeWeapon('1', { name: 'No stats', weapon_prop: [{ prop_type: 'FIGHT_PROP_NONE', init_value: 0 }] }, 'test');
  assert.equal(row.base_atk, null);
  assert.equal(row.secondary_stat_value, null);
  assert.equal(row.passive_description, null);
  assert.deepEqual(row.refinement_values, []);
});
test('artifact bonuses use explicit piece thresholds, including one-piece effects', () => {
  const row = normalizeArtifact('1', { rank: [3, 4], need: [4, 2, 1], affix: [
    { name: 'Test', desc: 'Four' }, { name: 'Test', desc: 'Two' }, { name: 'Test', desc: 'One' },
  ] }, 'test');
  assert.equal(row.two_piece_bonus, 'Two');
  assert.equal(row.four_piece_bonus, 'Four');
  assert.equal(row.additional_effects[0].pieces, 1);
  assert.throws(() => normalizeArtifact('1', { need: [2, 4], affix: [{ name: 'Test' }] }, 'test'));
});
test('cleans formatting and platform macros without deleting factual text', () => {
  assert.equal(cleanText('{LAYOUT_MOBILE#Tap}{LAYOUT_PC#Press}{LAYOUT_PS#Press} <color=#fff>20%</color>'), 'Press 20%');
});
test('local icon wins without contacting a remote host', async () => {
  assert.deepEqual(await resolveIcon(new Map([['staff-of-homa', '/assets/homa.webp']]), 'Staff of Homa', 'unused'),
    { url: '/assets/homa.webp', origin: 'local' });
});

test('generic stats preserve every curve level and separate ascension bonuses', () => {
  const payload = genericWeapon(normalizeWeapon('13501', { name: 'Staff of Homa', weapon_type: 'WEAPON_POLE',
    weapon_prop: [{ prop_type: 'FIGHT_PROP_BASE_ATTACK', init_value: 45.9364 }],
    stats_modifier: { atk: { base: 45.9364, levels: { 1: 1, 20: 2, 40: 4, 90: 9.173, 100: 10 } } },
    ascension: { 6: { fight_prop_base_attack: 186.7 } },
    refinement: { 1: { name: 'Test', desc: 'Rank 1', param_list: [0.2] }, 5: { name: 'Test', desc: 'Rank 5', param_list: [0.4] } },
  }, 'test'));
  assert.equal(payload.record.equipment_type, 'polearm');
  assert.equal(payload.children.length, 6);
  const curve = payload.children.find((x) => x.level === 90);
  const bonus = payload.children.find((x) => x.ascension === 6);
  assert.equal(curve.value, 421.3745972);
  assert.equal(curve.ascension, null);
  assert.equal(bonus.level, null);
  assert.equal(bonus.value, 186.7);
  assert.equal(Math.round(curve.value + bonus.value), 608);
  assert.deepEqual(payload.effects.map((x) => x.rank), [1, 5]);
  assert.equal(payload.record.metadata.progression.ascension['6'].fight_prop_base_attack, 186.7);
});

test('generic set effects support any threshold without dedicated bonus columns', () => {
  const data = { need: [1, 2, 4, 5], affix: [1, 2, 4, 5].map((pieces) => ({ name: 'Set', desc: `${pieces} pieces`, affix_id: pieces })) };
  const payload = genericArtifact(normalizeArtifact('1', data, 'test'));
  assert.deepEqual(payload.children.map((x) => x.pieces_required), [1, 2, 4, 5]);
  assert.equal(payload.record.set_category, 'artifact');
  assert.equal('two_piece_bonus' in payload.record, false);
});
