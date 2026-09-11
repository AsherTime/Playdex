export function normalizeWeaponName(value) {
  return String(value ?? '').normalize('NFKD').toLowerCase()
    .replace(/^\s*weapon:\s*/i, '').replace(/\br\d+\b/g, '')
    .replace(/[\u0300-\u036f'\u2018\u2019`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length];
}
const tokens = name => normalizeWeaponName(name).split(' ').filter(t => t.length >= 3 && !['the', 'and', 'of'].includes(t));

export function createWeaponResolver(equipment) {
  const weapons = equipment.filter(w => w.game_id === 'genshin-impact' && w.equipment_category === 'weapon');
  return (raw, weaponType) => {
    const key = normalizeWeaponName(raw);
    const type = normalizeWeaponName(weaponType);
    const compatible = w => !type || normalizeWeaponName(w.equipment_type) === type;
    const failed = (reason, candidates = []) => ({ weapon: null, method: 'unresolved', reason, candidates: candidates.slice(0, 5).map(w => ({ id: w.id, name: w.name, type: w.equipment_type })) });
    const choose = (candidates, method) => {
      const valid = candidates.filter(compatible);
      if (valid.length !== 1) return failed(valid.length ? 'ambiguous' : 'weapon_type_mismatch', candidates);
      return { weapon: valid[0], method: candidates.length > 1 ? 'weapon_type_assisted' : method, reason: null, candidates: [] };
    };
    if (!key) return failed('empty_name');
    const exact = weapons.filter(w => normalizeWeaponName(w.name) === key);
    if (exact.length) return choose(exact, 'exact');
    const aliases = weapons.filter(w => [w.slug, ...(Array.isArray(w.metadata?.aliases) ? w.metadata.aliases : [])].some(a => normalizeWeaponName(a) === key));
    if (aliases.length) return choose(aliases, 'alias');
    const words = tokens(key);
    if (!words.length) return failed('insufficient_name');
    const partial = weapons.filter(w => words.every(word => tokens(w.name).some(t => t.startsWith(word))));
    if (partial.length) return choose(partial, 'partial');
    if (!type) return failed('weapon_type_required_for_fuzzy');
    // Every meaningful input token must have a close counterpart; short tokens must be exact.
    const ranked = weapons.filter(compatible).map(w => ({ w, score: Math.min(...words.map(word => Math.max(...tokens(w.name).map(t => word.length < 6 ? Number(word === t) : 1 - distance(word, t) / Math.max(word.length, t.length))))) }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0]?.score >= 0.88 && ranked[0].score - (ranked[1]?.score ?? 0) >= 0.1) return choose([ranked[0].w], 'fuzzy');
    return failed('no_clear_high_confidence_match', ranked.slice(0, 5).map(r => r.w));
  };
}
