import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { parse } from 'node-html-parser';
export const GAME = 'wuthering-waves';
export const ROOT = 'reports/wuwa-comparisons';
export const slug = x => String(x ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const key = x => slug(x).replace(/-/g, '');
export const ELEMENTS = { 1: 'Glacio', 2: 'Fusion', 3: 'Electro', 4: 'Aero', 5: 'Spectro', 6: 'Havoc' };
export const WEAPONS = { 1: 'broadblade', 2: 'sword', 3: 'pistols', 4: 'gauntlets', 5: 'rectifier' };
export function clean(value, params = []) {
  const substituted = String(value ?? '').replace(/\{(\d+)\}/g, (m, n) => params[n] ?? m);
  const taggedValues = Object.fromEntries([...substituted.matchAll(/<SapTag=([^>]+)>([^<]+)<\/SapTag>/gi)].map(m=>[m[1],Number(m[2]) ]));
  const replaced = substituted
    .replace(/\{Cus:Ipt,[^}]*PC=([^}]*?)(?:\s+Gamepad=[^}]*)?\}/g, '$1')
    .replace(/\{Cus:Sap,S=(.*?) P=(.*?) SapTag=([^}]+)\}/g, (_, singular, plural, tag) => (taggedValues[tag] ?? Number(String(params[tag] ?? '').replace('%', ''))) >= 2 ? plural : singular)
    .replace(/<\/?(?:color|size|SapTag|ano)(?:=[^>]*|\s[^>]*)?>/gi, '')
    .replace(/\\n/g, '\n').replace(/\n/g, '<br>');
  return parse(`<div>${replaced}</div>`).structuredText.trim();
}
export async function get(url, json = true) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['ww.nanoka.cc', 'static.nanoka.cc'].includes(parsed.hostname)) throw new Error('Non-Nanoka source');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return json ? await response.json() : await response.text();
    } catch (e) { if (attempt === 2) throw e; }
  }
}
export async function cached(version, path) {
  const file = `${ROOT}/nanoka/${version}/${path}`;
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const data = await get(`https://static.nanoka.cc/ww/${version}/${path}`);
  await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  await writeFile(file, JSON.stringify(data));
  return data;
}
export async function assets(kind) {
  const dir = `public/assets/characters/${GAME}/${kind}`;
  const files = await readdir(dir).catch(() => []);
  return new Map(files.filter(f => /\.(png|webp|jpg)$/i.test(f)).map(f => [key(f.replace(/\.[^.]+$/, '')), `/${dir.slice(7)}/${f}`]));
}
export function icon(index, name, source) {
  return index.get(key(name)) ?? (source ? `https://static.nanoka.cc/assets/ww/${source.replace('/Game/Aki/UI/', '').split('.')[0]}.webp` : null);
}
