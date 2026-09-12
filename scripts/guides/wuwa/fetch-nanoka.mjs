import { writeFile } from 'node:fs/promises';
import { get, cached, ROOT } from './nanoka.mjs';
const html = await get('https://ww.nanoka.cc/character', false);
const manifest = await get('https://static.nanoka.cc/manifest.json');
const version = manifest.ww?.live;
if (!version) throw new Error('Nanoka version missing');
const roster = await cached(version, 'character.json');
for (const name of ['weapon', 'sonata', 'echo']) await cached(version, `${name}.json`);
const errors = [];
const ids = Object.keys(roster);
for (let offset = 0; offset < ids.length; offset += 4) {
  await Promise.all(ids.slice(offset, offset + 4).map(async id => {
    try { await cached(version, `en/character/${id}.json`); }
    catch (e) { errors.push({ id, error: e.message }); }
  }));
  console.log(`Characters ${Math.min(offset + 4, ids.length)}/${ids.length}`);
}
await writeFile(`${ROOT}/nanoka-source.json`, JSON.stringify({ version, manifest: manifest.ww, page_version: html.match(/static\.nanoka\.cc\/ww\/([^/]+)\/character\.json/)?.[1], fetched_at: new Date().toISOString(), characters: ids.length, errors }, null, 2));
console.log(JSON.stringify({ version, characters: ids.length, errors }));
