import { parse } from 'node-html-parser';

export const SOURCE_URL = 'https://game8.co/games/Genshin-Impact/archives/297465';
export const TIERS = ['SSS', 'SS', 'S', 'A+', 'A', 'B', 'C', 'D'];
export const ROLES = ['Main DPS', 'Sub-DPS', 'Support'];

export function extractRankings(html) {
  const document = parse(html);
  const container = document.querySelectorAll('.a-tabContainer').find(container =>
    container.querySelector('.a-tabs .a-tab.is-active')?.text.trim() === 'Main Tier List');
  const table = container?.querySelectorAll('.a-tabPanel.is-active table').find(table =>
    table.querySelectorAll('tr')[0]?.querySelectorAll('th').map(x => x.text.trim()).join('|') === '|Main DPS|Sub-DPS|Support');
  if (!table) throw new Error('Main Tier List table not found; refusing to guess.');
  const entries = [];
  const tiers = [];
  for (const row of table.querySelectorAll('tr').slice(1)) {
    const tier = row.querySelector('th img')?.getAttribute('alt')?.replace(/ Tier$/, '');
    if (!tier || !TIERS.includes(tier) || tiers.includes(tier)) throw new Error(`Unexpected tier: ${tier}`);
    tiers.push(tier);
    const cells = row.querySelectorAll('td');
    if (cells.length !== 3) throw new Error('Unexpected role columns');
    cells.forEach((cell, roleIndex) => {
      cell.querySelectorAll('a img').forEach((img, index) => {
        const label = img.getAttribute('alt') ?? '';
        const name = label.match(/^Genshin - (.+) (?:Sub-DPS|Support|DPS) Rank$/)?.[1];
        if (!name) throw new Error(`Unrecognized character label: ${label}`);
        entries.push({ name, tier, role: ROLES[roleIndex], sort_order: index });
      });
    });
  }
  if (tiers.join('|') !== TIERS.slice(1).join('|') || entries.length < 100) throw new Error('Incomplete tier table');
  const keys = entries.map(e => `${e.name}|${e.role}`);
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate source character/role');
  const heading = document.querySelectorAll('h2').find(x => /Genshin Impact Tier List for Version/.test(x.text));
  const version = heading?.text.match(/Version\s+([\d.]+)/)?.[1] ?? null;
  return { source_url: SOURCE_URL, source_version: version,
    source_updated_at: document.querySelector('time[itemprop="dateModified"]')?.getAttribute('datetime') ?? null,
    fetched_at: new Date().toISOString(), tiers: TIERS, roles: ROLES, entries };
}

const normalize = value => value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
export function matchCharacters(entries, characters) {
  const unmatched = [];
  const matched = entries.flatMap(entry => {
    const key = normalize(entry.name === 'Raiden' ? 'Raiden Shogun' : entry.name);
    let candidates = characters.filter(c => normalize(c.display_name) === key || normalize(c.slug) === key);
    // Game8 abbreviates family names. Only accept a unique whole-word suffix.
    if (!candidates.length) candidates = characters.filter(c => {
      const parts = c.display_name.split(/\s+/);
      return parts.some((_, index) => normalize(parts.slice(index).join(' ')) === key);
    });
    if (candidates.length !== 1) {
      unmatched.push({ ...entry, candidates: candidates.map(c => c.id) });
      return [];
    }
    return [{ ...entry, character_id: candidates[0].id, slug: candidates[0].slug }];
  });
  return { matched, unmatched };
}
