import nextEnv from '@next/env';
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const nodeRequire = createRequire(import.meta.url);
nextEnv.loadEnvConfig(process.cwd());

// Run the real old/new loaders against the same read-only database snapshot.
function load(file, source) {
  const filename = path.resolve(file);
  const code = ts.transpileModule(source ?? fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (id) => {
    if (id === 'server-only') return {};
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`);
    return nodeRequire(id);
  };
  new Function('require', 'module', 'exports', code)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const file = 'src/lib/guides/genshin.ts';
const baseline = process.argv[2] ?? 'HEAD';
const before = load(file, execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' }));
const after = load(file);
const normalize = (value) => {
  if (!value) return value;
  return { ...value, sourceRecords: [...value.sourceRecords].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    missingAssets: [...value.missingAssets].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) };
};

(async () => {
  for (const slug of ['aino', 'mavuika', 'no-such-character-performance-test']) {
    const start = performance.now();
    const oldData = await before.getGenshinGuideCharacter(slug);
    const middle = performance.now();
    const newData = await after.getGenshinGuideCharacter(slug);
    const end = performance.now();
    assert.deepStrictEqual(normalize(newData), normalize(oldData), `${slug}: guide content changed`);
    if (slug !== 'no-such-character-performance-test') assert.ok(newData?.kit && newData?.build);
    console.log(JSON.stringify({ slug, beforeMs: Math.round(middle - start), afterMs: Math.round(end - middle),
      equal: true, kit: Boolean(newData?.kit), build: Boolean(newData?.build), teams: newData?.teams.length ?? 0 }));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
