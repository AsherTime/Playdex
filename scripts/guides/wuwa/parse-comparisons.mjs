import { key, slug } from './nanoka.mjs';

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + Number(a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length];
}
export function matchName(label, items, aliases = {}) {
  const value = aliases[key(label)] ?? label;
  const exact = items.filter(x => key(x.name) === key(value));
  if (exact.length) return exact.length === 1 ? exact[0] : null;
  const withoutArticles = text => key(String(text).replace(/\b(the|of|and)\b/gi,''));
  const articleMatch = items.filter(x=>withoutArticles(x.name)===withoutArticles(value));
  if(articleMatch.length === 1) return articleMatch[0];
  const partial = items.filter(x => slug(x.name).split('-').includes(slug(value)));
  if (key(value).length >= 3 && partial.length === 1) return partial[0];
  const ranked = items.map(x => ({ x, score: 1 - distance(key(value), key(x.name)) / Math.max(key(value).length, key(x.name).length) })).sort((a,b) => b.score-a.score);
  return ranked[0]?.score >= 0.90 && ranked[0].score - (ranked[1]?.score ?? 0) >= 0.08 ? ranked[0].x : null;
}
export function shorthand(workbook) {
  const cells = workbook.sheets['Set Shorthand'];
  const at = (r, c) => cells.find(x => x.row === r && x.col === c)?.value;
  const sets = {}, weapons = {};
  for (const cell of cells.filter(x => x.row >= 4 && [1,4].includes(x.col))) {
    const value = at(cell.row, cell.col + 1);
    for (const alias of String(value ?? '').split('/')) if(alias) (cell.col === 1 ? sets : weapons)[key(alias)] = cell.value;
  }
  return { sets, weapons };
}
const initials = (value, all = false) => value.split(/[\s'-]+/).filter(w => all || !['of','the','and'].includes(w.toLowerCase())).map(w => w[0]).join('');
export function parseEcho(raw, character, sets, echoes, aliases) {
  const unresolved = [];
  const resolveSet = label => {
    const fromSheet = aliases[key(label)];
    const found = matchName(fromSheet ?? label, sets);
    if (found) return found;
    const acronym = sets.filter(s => [initials(s.name),initials(s.name,true)].some(a=>key(a)===key(label)));
    // ETR is the alternate Eternal Radiance abbreviation used in the workbook's Zani/Phoebe tables.
    if (key(label) === 'etr') return sets.find(s => s.name === 'Eternal Radiance') ?? null;
    return acronym.length === 1 ? acronym[0] : null;
  };
  const markers = raw.match(/\*+/g) ?? [];
  const notes = [...raw.matchAll(/\(([^)]*)\)/g)].map(m => m[1]);
  const outer = raw.replace(/\([^)]*\)/g, '').replace(/\*/g, '').trim();
  const pattern = outer.match(/\b([134]{5})\b/);
  const prefix = outer.split(/\b[134]{5}\b/)[0].trim();
  const noCost = outer.match(/^(.*?)\s+((?:ELE|ATK|HP|DEF|ER|CR|CD)\/(?:ELE|ATK|HP|DEF|ER|CR|CD))$/i);
  let primary = pattern ? resolveSet(prefix) : noCost ? resolveSet(noCost[1]) : null;
  const combinations = [];
  let secondary = [];
  let mainEcho = null;
  const variant = [];
  if (!primary && pattern) unresolved.push({ kind: 'primary_set', value: prefix });
  if (!pattern && !primary) variant.push(outer);
  const mixed = outer.match(/^2pc\s*2pc\s+([^ (]+)/i);
  if (mixed) {
    for (const token of mixed[1].split('/')) {
      const set = resolveSet(token);
      if(set) combinations.push({ id: set.id, name: set.name, pieces: 2 });
      else unresolved.push({ kind: 'set_combination', value: token });
    }
  }
  for (const note of notes) {
    const two = note.match(/^2pc\s+([^ ]+)(.*)$/i);
    if (two) {
      for (const token of two[1].split('/')) {
        const set = resolveSet(token);
        if(set) secondary.push({ id: set.id, name: set.name, pieces: 2 });
        else unresolved.push({ kind: 'secondary_set', value: token });
      }
      if(two[2].trim()) variant.push(two[2].trim());
    } else if (/^no 2pc$/i.test(note)) variant.push('No additional 2-piece set');
    else {
      const candidates = echoes.filter(e => !primary || e.groups?.map(String).includes(String(primary.source_id)));
      const echo = matchName(note, candidates);
      if(echo && !mainEcho) mainEcho = { id: echo.id, name: echo.name, icon_url: echo.icon_url };
      else { variant.push(note); unresolved.push({ kind: 'variant_note', value: note }); }
    }
  }
  const statsRaw = pattern ? outer.slice(outer.indexOf(pattern[0]) + 5).trim() : noCost?.[2] ?? '';
  const stats = statsRaw ? statsRaw.split('/').map(s => s.trim().toUpperCase()) : [];
  const statNames = { ELE: `${character.element} DMG`, ATK: 'ATK%', HP: 'HP%', DEF: 'DEF%', ER: 'Energy Regen', CR: 'CRIT Rate', CD: 'CRIT DMG' };
  const normalizedStats = stats.map(s => statNames[s] ?? null);
  if(normalizedStats.includes(null)) unresolved.push({ kind: 'main_stats', value: statsRaw });
  // Only stated slots are assigned; unstated 4-cost and 1-cost main stats remain null.
  const costs = pattern ? [...pattern[0]].map(Number) : [];
  const mainStats = costs.map(() => null);
  const slots = costs.map((cost,i) => ({cost,i})).filter(x => x.cost === (costs.includes(3) ? 3 : 4));
  if(slots.length === stats.length) slots.forEach((x,i) => { mainStats[x.i] = normalizedStats[i]; });
  if(!primary && !combinations.length) unresolved.push({ kind: 'setup', value: raw });
  return { primary_set_id: primary?.id ?? null, primary_set_name: primary?.name ?? null,
    set_combinations: combinations, secondary_sets: secondary, secondary_relation: secondary.length > 1 ? 'alternatives' : null,
    cost_pattern: costs, main_stats: mainStats, stated_main_stats: normalizedStats.filter(Boolean), raw_main_stats: statsRaw,
    main_echo: mainEcho, variant_note: variant.join('; ') || null, markers, unresolved };
}

export function parseWorkbook(workbook, characters, weapons, sets, echoes) {
  const aliases = shorthand(workbook);
  const index = workbook.sheets.Index;
  const completed = index.filter(x => x.col === 1 && x.row >= 3 && index.some(y => y.row === x.row && y.col === 2));
  const report = { completed_detected: completed.length, sheets: [], skipped: [], unresolved: [], errors: [] };
  const comparisons = [];
  for (const item of completed) {
    const names = Object.keys(workbook.sheets);
    const sourceName = String(item.value);
    const strip = x => key(x.replace(/\(Sub DPS\)/i, '').replace(/[()]/g, ''));
    const matches = names.filter(n => strip(n) === strip(sourceName) || (sourceName === 'Yangyang: Xuanling' && n === 'Xuanling'));
    const sheet = matches.length === 1 ? matches[0] : names.find(n => strip(n.replace(/\s*\(WIP\)/i,'')) === strip(sourceName));
    if(!sheet || /WIP/i.test(sheet)) { report.skipped.push({ name:sourceName, sheet, reason: sheet ? 'WIP sheet conflicts with completed Index' : 'sheet_missing' }); continue; }
    const characterName = sourceName.replace(/\s*\([^)]*\)/g, '');
    const charAliases = { xly: 'Xiangli Yao', aerover: 'Rover: Aero', ciaconna:'Ciaccona', cartethiya:'Cartethyia' };
    const character = matchName(characterName, characters, charAliases);
    if(!character) { report.skipped.push({ name:sourceName, reason:'character_unmatched' }); continue; }
    const cells = workbook.sheets[sheet];
    const at = (r,c) => cells.find(x => x.row === r && x.col === c)?.value;
    const firstTeamRow = cells.find(c=>c.col===1&&typeof c.value==='string'&&/team damage|team setups|rDPR/i.test(c.value))?.row ?? Infinity;
    const footnotes = cells.filter(c=>c.col===1&&c.row<firstTeamRow&&typeof c.value==='string'&&(/^\*|average of|Unless mentioned|Assuming/i.test(c.value))).map(c=>c.value);
    const version = index.find(x => x.row === item.row && x.col === 2)?.value;
    const sheetRecord = { sheet, character:character.name, version, sheet_title:at(1,1), tables:0 };
    report.sheets.push(sheetRecord);
    for(const header of cells.filter(x => x.col === 1 && /^(Name|Weapon|Setup)$/i.test(String(x.value)))) {
      const title = String(at(header.row-1,1) ?? '');
      if(/team|rDPR|investment/i.test(title) || !title) continue;
      const first = String(at(header.row+1,1) ?? '');
      let type = /Sequence/i.test(title) || /^S\d/.test(first) ? 'sequence' : /Weapon Comparison/i.test(title) ? 'weapon' : /Set Comparison/i.test(title) ? 'echo_setup' : null;
      if(!type && /Personal damage/i.test(title)) {
        if(/^Signature\b/i.test(first)) type='weapon';
        else if(/\b[134]{5}\b|^2pc2pc/i.test(first)) type='echo_setup';
      }
      if(!type) continue;
      const percentCols = cells.filter(c => c.row === header.row && c.col >= 3 && c.col <= 5 && /^%/.test(String(c.value))).map(c=>c.col);
      for(const pc of percentCols) {
        const damageCol=pc-1;
        const context = String(at(header.row,damageCol));
        const mode = /previous/i.test(title) ? 'previous' : /Compared to S0/i.test(title) ? 's0' : null;
        const titleBase = title.replace(/\s*\(Compared to (previous|S0)\)\s*/i,'').replace(/\s+/g,' ').trim();
        const id = `wuwa-dpr:${slug(sheet)}:${type}:${header.row}:${pc}`;
        const table = { id, game_id:'wuthering-waves', character_id:character.id, comparison_type:type, title:titleBase,
          source:'dpr-calc-results', source_version:version, status:'completed',
          metadata:{ sheet, sheet_title:at(1,1), workbook:workbook.file, sha256:workbook.sha256, title_cell:`A${header.row-1}`, context, mode, notes:[...footnotes], index_version:version }, entries:[] };
        let end=header.row+1;
        for(;end<=Math.max(...cells.map(c=>c.row));end++) {
          const label=at(end,1), damage=at(end,damageCol), relative=at(end,pc);
          if(typeof label!=='string' || typeof damage!=='number' || typeof relative!=='number') break;
          const details={ source_row:end, source_damage_column:damageCol, source_percent_column:pc, markers:label.match(/\*+/g)??[] };
          let canonical=null, setId=null, display=label.trim();
          if(type==='weapon') {
            const setupSuffix=label.match(/\b[134]{5}\b.*$/)?.[0];
            const rawName=label.replace(/\b[134]{5}\b.*$/,'').replace(/\([^)]*\)/g,'').replace(/\bR\d+\b/gi,'').replace(/\*/g,'').trim();
            const compatible=weapons.filter(w=>w.equipment_type===character.weapon_type);
            let found;
            if(/^signature$/i.test(rawName)) {
              found=compatible.find(w=>String(w.source_id)===String(character.metadata.recommended_weapon_source_ids?.[0]));
              details.resolution_source='Nanoka character recommend.weapon[0]';
              // A generic standard recommendation is not evidence of a signature weapon.
              if(!found || found.rarity!==5) found=null;
            } else found=matchName(rawName,compatible,aliases.weapons);
            canonical=found?.id??null;
            display=found?.name??(/^signature$/i.test(rawName)?'Weapon identity pending':rawName);
            details.rank=Number(label.match(/\bR(\d+)\b/i)?.[1])||null;
            details.variant_note=[...label.matchAll(/\(([^)]*)\)/g)].map(m=>m[1]).concat(setupSuffix?[setupSuffix]:[]).join('; ')||null;
            if(setupSuffix) details.echo_configuration={cost_pattern:setupSuffix.slice(0,5).split('').map(Number),raw_main_stats:setupSuffix.slice(5).trim()};
            details.icon_url=found?.icon_url??null;
            if(!found) report.unresolved.push({sheet,type,label,reason:'weapon_unmatched'});
          } else if(type==='echo_setup') {
            Object.assign(details,parseEcho(label,character,sets,echoes,aliases.sets));
            setId=details.primary_set_id;
            display=details.primary_set_name ?? (details.set_combinations.length ? details.set_combinations.map(s=>`2pc ${s.name}`).join(' + ') : 'Echo setup');
            details.icon_url=sets.find(s=>s.id===setId)?.icon_url??null;
            for(const issue of details.unresolved) report.unresolved.push({sheet,type,label,...issue});
          } else {
            const seq=label.match(/^S(\d+)(?:R(\d+))?/i);
            if(!seq) {report.errors.push({sheet,row:end,reason:'invalid_sequence'});continue;}
            details.sequence=Number(seq[1]); details.rank=Number(seq[2])||null;
            details.relative_to_previous=mode==='previous'?relative:null;
            details.relative_to_s0=mode==='s0'?relative:null;
            display=`S${seq[1]}${seq[2]?` R${seq[2]}`:''}`;
          }
          table.entries.push({ id:`${id}:${end}`, comparison_id:id, equipment_id:canonical, set_id:setId,
            label:display, raw_label:label, damage, relative_value:relative, sort_order:table.entries.length, details });
        }
        for(let r=end;r<end+8;r++) {
          const note=at(r,1);
          if(typeof note!=='string') continue;
          if(/comparison|team|personal damage/i.test(note) && !/^\*/.test(note)) break;
          if(at(r,2)==null) table.metadata.notes.push(note);
        }
        if(table.entries.length) {comparisons.push(table);sheetRecord.tables++;}
      }
    }
  }
  // Pair sequence views only when every sequence/rank and damage agrees. Keep unmatched contexts separate.
  for(const current of comparisons.filter(t=>t.comparison_type==='sequence'&&t.metadata.mode==='previous')) {
    const other=comparisons.find(t=>t!==current&&t.character_id===current.character_id&&t.metadata.sheet===current.metadata.sheet&&t.metadata.mode==='s0'&&t.entries.length===current.entries.length&&t.entries.every((e,i)=>e.label===current.entries[i].label&&e.damage===current.entries[i].damage));
    if(other) {
      current.entries.forEach((e,i)=>{e.details.relative_to_s0=other.entries[i].relative_value;e.details.s0_source_row=other.entries[i].details.source_row;});
      current.metadata.s0_title_cell=other.metadata.title_cell;
      current.metadata.notes=[...new Set([...current.metadata.notes,...other.metadata.notes])];
      other.merged=true;
    }
  }
  report.wip_sheets=Object.keys(workbook.sheets).filter(n=>/WIP/i.test(n));
  return { comparisons:comparisons.filter(t=>!t.merged), report, shorthand:aliases };
}
