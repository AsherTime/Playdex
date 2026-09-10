import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { GAME_ID, discoverVersion, fetchNanoka, indexAssets, resolveIcon, normalizeWeapon, normalizeArtifact,
  genericWeapon, genericArtifact } from './nanoka-equipment.mjs';

nextEnv.loadEnvConfig(process.cwd());
const stored = process.argv.includes('--stored');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing server Supabase environment configuration');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const config = {
  weapon: { table: 'game_equipment', rpc: 'import_game_equipment', normalize: normalizeWeapon, convert: genericWeapon,
    children: 'game_equipment_stats', effects: 'game_equipment_effects', owner: 'equipment_id' },
  artifact: { table: 'game_equipment_sets', rpc: 'import_game_equipment_set', normalize: normalizeArtifact, convert: genericArtifact,
    children: 'game_equipment_set_bonuses', owner: 'set_id' },
};
const icons = { weapon: indexAssets('weapons'), artifact: indexAssets('artifacts') };
const report = { startedAt: new Date().toISOString(), mode: stored ? 'stored-json-replay' : 'nanoka-live',
  upserted: { weapon: 0, artifact: 0 }, stats: 0, effects: 0, bonuses: 0, failures: [], verification: {}, samples: [] };
const checked = async (query) => { const { data, error } = await query; if (error) throw new Error(error.message); return data; };
async function allRows(table) {
  const rows = [];
  for (let start = 0; ; start += 500) {
    const batch = await checked(db.from(table).select('*').eq('game_id', GAME_ID).eq('source_site', 'nanoka').order('source_id').range(start, start + 499));
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
async function workers(items, callback) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, async () => {
    while (cursor < items.length) await callback(items[cursor++]);
  }));
}
function canonicalSort(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
async function verifyChildren(c, id, payload) {
  const actual = await checked(db.from(c.children).select('*').eq(c.owner, id));
  const cleaned = actual.map(({ [c.owner]: owner, ...fields }) => { void owner; return fields; });
  assert.deepStrictEqual(canonicalSort(cleaned), canonicalSort(payload.children), `${id}: child data mismatch`);
  if (c.effects) {
    const effects = await checked(db.from(c.effects).select('*').eq(c.owner, id));
    assert.deepStrictEqual(canonicalSort(effects.map(({ equipment_id, ...fields }) => { void equipment_id; return fields; })),
      canonicalSort(payload.effects), `${id}: effect data mismatch`);
  }
}

const run = await checked(db.from('guide_import_runs').insert({ game_id: GAME_ID, importer: 'nanoka-equipment-importer', scope: stored ? 'stored' : 'full', status: 'running' }).select('id').single());
try {
  const before = {};
  const jobs = [];
  const version = stored ? null : await discoverVersion();
  report.version = version;
  for (const [kind, c] of Object.entries(config)) {
    before[kind] = await allRows(c.table);
    if (stored) {
      if (!before[kind].length) throw new Error(`No stored ${kind} records to replay`);
      jobs.push(...before[kind].map((prior) => ({ kind, id: prior.source_id, prior })));
    } else {
      const catalog = await fetchNanoka(`https://static.nanoka.cc/gi/${version}/${kind}.json`);
      const included = Object.entries(catalog).filter(([, row]) => !(kind === 'weapon' && row.skin === true));
      if (!included.length) throw new Error(`Empty ${kind} catalog`);
      jobs.push(...included.map(([id]) => ({ kind, id })));
    }
  }
  await workers(jobs, async ({ kind, id, prior }) => {
    const c = config[kind];
    try {
      const source = stored ? prior.raw_data : await fetchNanoka(`https://static.nanoka.cc/gi/${version}/en/${kind}/${id}.json`);
      const name = kind === 'weapon' ? source.name : source.affix?.find((x) => x.name)?.name;
      const icon = stored ? prior.icon_url : (await resolveIcon(icons[kind], name, source.icon)).url;
      const row = c.normalize(id, source, stored ? prior.source_version : version, icon);
      if (stored) {
        // JSONB reorders keys; preserve the hash of the original source text.
        row.content_hash = prior.content_hash;
        row.last_checked_at = prior.last_checked_at;
      }
      const payload = c.convert(row);
      const targetId = await checked(db.rpc(c.rpc, { p_record: payload.record, p_children: payload.children, p_effects: payload.effects }));
      await verifyChildren(c, targetId, payload);
      report.upserted[kind]++;
      if (kind === 'weapon') { report.stats += payload.children.length; report.effects += payload.effects.length; }
      else report.bonuses += payload.children.length;
      if (['13501', '11401', '15002', '15020'].includes(id)) report.samples.push({ kind, id, name, canonicalId: targetId, verified: true });
    } catch (error) { report.failures.push({ kind, id, error: error.message }); }
  });
  for (const [kind, c] of Object.entries(config)) {
    const after = await allRows(c.table);
    const byId = new Map(after.map((row) => [row.source_id, row]));
    assert.equal(byId.size, after.length, 'Duplicate canonical identities');
    for (const prior of before[kind]) {
      const current = byId.get(prior.source_id);
      assert.equal(current?.id, prior.id);
      assert.equal(current?.imported_at, prior.imported_at);
      if (stored) {
        for (const field of ['raw_data', 'icon_url', 'source_site', 'source_url', 'source_data_url', 'source_version', 'content_hash', 'last_checked_at'])
          assert.deepStrictEqual(current[field], prior[field], `${kind}/${prior.source_id}: ${field} changed`);
      }
    }
    assert.ok(jobs.filter((job) => job.kind === kind).every((job) => byId.has(job.id)), 'Missing catalog records');
    report.verification[kind] = { before: before[kind].length, after: after.length, preservedIds: before[kind].length, uniqueIds: byId.size };
  }
} catch (error) { report.failures.push({ stage: 'run', error: error.message }); }
finally {
  report.finishedAt = new Date().toISOString();
  report.status = report.failures.length ? 'partial' : 'completed';
  await checked(db.from('guide_import_runs').update({ status: report.status, finished_at: report.finishedAt,
    successful_records: report.upserted.weapon + report.upserted.artifact, failed_records: report.failures.length,
    errors: report.failures, report }).eq('id', run.id));
  const folder = join(process.cwd(), 'reports', 'nanoka-equipment');
  mkdirSync(folder, { recursive: true });
  const reportPath = join(folder, `${run.id}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
