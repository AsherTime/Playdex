import test from 'node:test';
import assert from 'node:assert/strict';
import { matchName, parseEcho } from './parse-comparisons.mjs';
import { clean } from './nanoka.mjs';

const sets = [
  { id: 'valor', name: 'Crown of Valor', source_id: '1' },
  { id: 'thunder', name: 'Void Thunder', source_id: '2' },
  { id: 'radiance', name: 'Eternal Radiance', source_id: '11' },
];
test('Echo costs and stated stats stay separate from secondary sets', () => {
  const result = parseEcho('CoV 43311 ELE/ELE (2pc VT)', { element: 'Electro' }, sets, [], {});
  assert.equal(result.primary_set_id, 'valor');
  assert.deepEqual(result.cost_pattern, [4, 3, 3, 1, 1]);
  assert.deepEqual(result.main_stats, [null, 'Electro DMG', 'Electro DMG', null, null]);
  assert.equal(result.secondary_sets[0].id, 'thunder');
});
test('Main Echo parentheses are not interpreted as secondary sets', () => {
  const result = parseEcho('ETR 43311 ELE/ELE (Capitaneus)', { element: 'Spectro' }, sets,
    [{ id: 'cap', name: 'Capitaneus', groups: [11] }], {});
  assert.equal(result.main_echo.id, 'cap');
  assert.deepEqual(result.secondary_sets, []);
});
test('Unknown configurations retain their note and remain unresolved', () => {
  const result = parseEcho('Unknown 443311 (uncertain condition)', { element: 'Havoc' }, sets, [], {});
  assert.equal(result.primary_set_id, null);
  assert.deepEqual(result.cost_pattern, []);
  assert.ok(result.variant_note.includes('uncertain condition'));
  assert.ok(result.unresolved.length);
});
test('Ambiguous names are not guessed', () => {
  assert.equal(matchName('Blade', [{ name: 'First Blade' }, { name: 'Second Blade' }]), null);
  assert.equal(matchName('Last Dance', [{ name: 'The Last Dance' }]).name, 'The Last Dance');
});
test('Source formatting wrappers are removed from kit prose', () => {
  assert.equal(clean('<color=#ff0000>Damage</color>'), 'Damage');
});
