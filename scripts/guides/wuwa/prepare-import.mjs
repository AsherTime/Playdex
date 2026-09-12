import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GAME, ROOT, cached, assets, icon, slug, clean, ELEMENTS, WEAPONS } from './nanoka.mjs';
import { parseWorkbook } from './parse-comparisons.mjs';
export const uuid = value => { const h=createHash('sha256').update(value).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; };
export async function prepare() {
  const source=JSON.parse(await readFile(`${ROOT}/nanoka-source.json`,'utf8'));
  const version=source.version;
  const roster=await cached(version,'character.json');
  const weaponData=await cached(version,'weapon.json');
  const setData=await cached(version,'sonata.json');
  const echoData=await cached(version,'echo.json');
  const characterIcons=await assets('characters'), weaponIcons=await assets('weapons'), echoIcons=await assets('echoes');
  const weapons=Object.entries(weaponData).filter(([,v])=>v.en).map(([id,v])=>({
    id:uuid(`${GAME}:nanoka:weapon:${id}`),game_id:GAME,source_site:'nanoka',source_id:id,slug:slug(v.en),name:v.en,
    equipment_category:'weapon',equipment_type:WEAPONS[v.type]??null,rarity:v.rank,icon_url:icon(weaponIcons,v.en,v.icon),
    source_url:`https://ww.nanoka.cc/weapon/${id}`,source_data_url:`https://static.nanoka.cc/ww/${version}/weapon.json`,source_version:version,
    metadata:{ rank_terminology:'syntony' },raw_data:v
  }));
  const sets=Object.entries(setData).map(([id,v])=>({id:uuid(`${GAME}:nanoka:sonata:${id}`),game_id:GAME,source_site:'nanoka',source_id:id,
    slug:slug(v.name.en),name:v.name.en,set_category:'sonata',icon_url:icon(echoIcons,v.name.en,v.icon),
    source_url:'https://ww.nanoka.cc/echo',source_data_url:`https://static.nanoka.cc/ww/${version}/sonata.json`,source_version:version,raw_data:v,
    metadata:{bonuses:Object.entries(v.set??{}).map(([pieces,s])=>({pieces:Number(pieces),description:clean(s.en?.desc,s.en?.param)}))}
  }));
  const echoes=Object.entries(echoData).filter(([,v])=>v.en).map(([id,v])=>({id,source_id:id,name:v.en,groups:v.group,icon_url:icon(echoIcons,v.en,v.icon)}));
  const characters=[], abilities=[], sourceRecords=[];
  // Rover's male/female records share one canonical element identity, with all source IDs retained.
  const groups=new Map();
  for(const [id,r] of Object.entries(roster)) { const k=slug(r.en);groups.set(k,[...(groups.get(k)??[]),id]); }
  for(const [characterSlug,ids] of groups) {
    const id=ids[0], r=roster[id], d=await cached(version,`en/character/${id}.json`);
    const cid=`${GAME}-${characterSlug}`;
    const row={id:cid,game_id:GAME,slug:characterSlug,name:d.name,display_name:d.name,source_character_id:id,
      rarity:d.rarity,element:ELEMENTS[d.element]??null,weapon_type:WEAPONS[d.weapon]??null,icon_key:d.icon,
      portrait_url:icon(characterIcons,d.name,d.icon),is_playable:true,
      metadata:{source_site:'nanoka',source_version:version,source_ids:ids,source_url:`https://ww.nanoka.cc/character/${id}`,raw_roster:ids.map(i=>roster[i]),
        recommended_weapon_source_ids:d.recommend?.weapon??[],description:clean(d.desc),stats:d.stats,tag:d.tag}}
    characters.push(row);
    const entries=[...Object.entries(d.skill_trees??{}).filter(([,n])=>n.skill?.type).map(([k,n])=>({key:`skill-${k}`,skill:n.skill,type:n.skill.type==='Normal Attack'?'Basic Attack':n.skill.type,order:Number(k),raw:n})),
      ...Object.entries(d.chains??{}).map(([k,n])=>({key:`chain-${k}`,skill:n,type:'Resonance Chain',order:100+Number(k),raw:n}))];
    for(const entry of entries) abilities.push({id:`${cid}:${entry.key}`,game_id:GAME,character_id:cid,source_site:'nanoka',source_id:entry.key,
      ability_type:slug(entry.type).replace(/-/g,'_'),name:entry.skill.name,description:clean(entry.skill.desc,entry.skill.param),
      icon_url:icon(new Map(),entry.skill.name,entry.skill.icon),sort_order:entry.order,source_url:`https://ww.nanoka.cc/character/${id}`,
      source_version:version,raw_data:entry.raw});
    sourceRecords.push({id:`${cid}-nanoka-kit`,game_id:GAME,character_id:cid,source_site:'nanoka',source_type:'kit',
      source_url:`https://ww.nanoka.cc/character/${id}`,source_character_id:id,source_slug:characterSlug,status:entries.length?'success':'partial',
      metadata:{version,source_ids:ids,source_data_url:`https://static.nanoka.cc/ww/${version}/en/character/${id}.json`,raw_data:{skill_trees:d.skill_trees,chains:d.chains,skill_branches:d.skill_branches,forte:d.forte,forte_new:d.forte_new}},missing_fields:entries.length?[]:['abilities']});
  }
  const workbook=JSON.parse(await readFile(`${ROOT}/workbook.json`,'utf8'));
  const parsed=parseWorkbook(workbook,characters,weapons,sets,echoes);
  const find=(sheet,type)=>parsed.comparisons.find(t=>t.metadata.sheet===sheet&&t.comparison_type===type);
  const examples={};
  for(const name of ['Augusta','Zani','Phrolova']) {
    const weapon=find(name,'weapon'),echo=find(name,'echo_setup'),sequence=find(name,'sequence');
    assert.ok(weapon?.entries[0].equipment_id,`${name} signature not resolved`);
    assert.ok(echo?.entries.length&&sequence?.entries.length);
    examples[name]={weapon:weapon.entries[0],echoes:echo.entries,sequence:sequence.entries};
  }
  const aug=examples.Augusta;
  assert.equal(aug.weapon.label,'Thunderflare Dominion');assert.equal(aug.weapon.damage,1217051.433);
  assert.deepEqual(aug.echoes[0].details.cost_pattern,[4,3,3,1,1]);
  assert.equal(aug.echoes[0].details.secondary_sets[0].name,'Void Thunder');
  assert.deepEqual(aug.echoes.find(e=>e.raw_label.includes('44111')).details.stated_main_stats,['CRIT Rate','CRIT DMG']);
  assert.deepEqual(aug.sequence.map(e=>e.damage),[1217051.433,1434140.229,1822476.441,2128811.649]);
  assert.equal(aug.sequence[2].details.relative_to_s0,1.497452278);assert.equal(aug.sequence[2].details.relative_to_previous,1.270779805);
  const z=examples.Zani.echoes;
  assert.equal(z[0].details.main_echo.name,'Capitaneus');assert.equal(z[2].details.main_echo.name,'Nightmare: Mourning Aix');
  assert.deepEqual(z[0].details.secondary_sets,[]);
  const ph=examples.Phrolova.echoes;
  assert.deepEqual(ph[0].details.secondary_sets.map(s=>s.name),['Havoc Eclipse','Midnight Veil']);
  assert.deepEqual(ph.find(e=>e.raw_label.includes('44111')).details.stated_main_stats,['CRIT DMG','CRIT DMG']);
  assert.ok(parsed.comparisons.every(t=>!(/team|investment|rDPR/i.test(t.title))));
  const output={source,characters,abilities,weapons,sets,sourceRecords,...parsed,examples};
  await writeFile(`${ROOT}/prepared.json`,JSON.stringify(output));
  await writeFile(`${ROOT}/parser-report.json`,JSON.stringify({...parsed.report,examples},null,2));
  console.log(JSON.stringify({characters:characters.length,abilities:abilities.length,weapons:weapons.length,sets:sets.length,
    tables:parsed.comparisons.length,counts:Object.fromEntries(['weapon','echo_setup','sequence'].map(type=>[type,{tables:parsed.comparisons.filter(t=>t.comparison_type===type).length,entries:parsed.comparisons.filter(t=>t.comparison_type===type).reduce((n,t)=>n+t.entries.length,0)}])),
    completed:parsed.report.completed_detected,skipped:parsed.report.skipped,unresolved:parsed.report.unresolved.length},null,2));
  return output;
}
if(process.argv[1]?.endsWith('prepare-import.mjs')) await prepare();
