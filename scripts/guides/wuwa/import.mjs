import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { prepare } from './prepare-import.mjs';
import { GAME,ROOT,clean } from './nanoka.mjs';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=r=>{if(r.error)throw new Error(r.error.message);return r.data;};
async function all(table,configure=q=>q) {
  const rows=[];
  for(let from=0;;from+=500){const batch=checked(await configure(db.from(table).select('*')).range(from,from+499));rows.push(...batch);if(batch.length<500)return rows;}
}
const data=await prepare();
const sourceFile='C:/Users/User/Downloads/DPR Calc Results.xlsx';
const fileHash=async()=>createHash('sha256').update(await readFile(sourceFile)).digest('hex');
const workbook=JSON.parse(await readFile(`${ROOT}/workbook.json`,'utf8'));
assert.equal(await fileHash(),workbook.sha256);
const protectedTables=['game_characters','game_equipment','game_equipment_sets','team_damage_calculations'];
async function protectedData(){return Promise.all(protectedTables.map(t=>all(t,q=>q.eq('game_id','genshin-impact').order('id'))));}
const before=await protectedData();
// Reuse IDs if any records were already imported by another canonical importer.
const storedWeapons=await all('game_equipment',q=>q.eq('game_id',GAME));
const storedSets=await all('game_equipment_sets',q=>q.eq('game_id',GAME));
const storedCharacters=await all('game_characters',q=>q.eq('game_id',GAME));
const idMap=new Map();
for(const [incoming,stored] of [[data.weapons,storedWeapons],[data.sets,storedSets],[data.characters,storedCharacters]]){
  for(const row of incoming){const old=stored.find(s=>row.source_id?s.source_id===row.source_id&&s.source_site===row.source_site:s.source_character_id===row.source_character_id||s.slug===row.slug);if(old){idMap.set(row.id,old.id);row.id=old.id;}}
}
const replaceIds=value=>typeof value==='string'?(idMap.get(value)??value):Array.isArray(value)?value.map(replaceIds):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceIds(v)])):value;
const abilities=data.abilities.map(replaceIds),records=data.sourceRecords.map(replaceIds),comparisons=data.comparisons.map(replaceIds);
const entries=comparisons.flatMap(t=>t.entries);
const parents=comparisons.map(({entries,...t})=>t);
const bonuses=data.sets.flatMap(s=>Object.entries(s.raw_data.set??{}).map(([pieces,v])=>({set_id:s.id,pieces_required:Number(pieces),effect_key:'canonical',description:clean(v.en?.desc,v.en?.param),parameters:{values:v.en?.param??[]},sort_order:Number(pieces)})));
const batches=[['game_characters',data.characters,'id'],['game_equipment',data.weapons,'game_id,source_site,source_id'],['game_equipment_sets',data.sets,'game_id,source_site,source_id'],
  ['game_equipment_set_bonuses',bonuses,'set_id,pieces_required,effect_key'],['character_guide_source_records',records,'id'],['character_abilities',abilities,'id'],
  ['character_build_comparisons',parents,'id'],['character_build_comparison_entries',entries,'id']];
if(process.argv.includes('--write'))for(const [table,rows,onConflict] of batches){
  for(let i=0;i<rows.length;i+=75)checked(await db.from(table).upsert(rows.slice(i,i+75),{onConflict}));
  console.log(`${table}: ${rows.length}`);
}
if(process.argv.includes('--write')||process.argv.includes('--verify')){
  for(const [table,rows] of batches){
    const saved=await all(table, q=>['game_characters','game_equipment','game_equipment_sets','character_guide_source_records','character_abilities','character_build_comparisons'].includes(table)?q.eq('game_id',GAME).order('id'):q.order(table==='game_equipment_set_bonuses'?'set_id':'id'));
    for(const expected of rows){const actual=saved.find(s=>expected.id?s.id===expected.id:s.set_id===expected.set_id&&s.pieces_required===expected.pieces_required&&s.effect_key===expected.effect_key);assert.ok(actual,`Missing ${table}: ${expected.id}`);for(const [k,v]of Object.entries(expected))assert.deepEqual(actual[k],v,`${table} ${expected.id} ${k}`);}
  }
  const publicDb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
  assert.equal(checked(await publicDb.from('character_build_comparisons').select('id').eq('game_id',GAME)).length,parents.length);
}
assert.deepEqual(await protectedData(),before,'Genshin data changed');
assert.equal(await fileHash(),workbook.sha256,'Source workbook changed');
const report={nanoka_version:data.source.version,characters:data.characters.length,abilities:abilities.length,completed_sheets:data.report.completed_detected,
  processed_sheets:data.report.sheets.length,wip_skipped:data.report.wip_sheets,index_conflicts:data.report.skipped,
  no_comparison_tables:data.report.sheets.filter(s=>!s.tables),
  counts:Object.fromEntries(['weapon','echo_setup','sequence'].map(type=>[type,{comparisons:parents.filter(t=>t.comparison_type===type).length,entries:comparisons.filter(t=>t.comparison_type===type).reduce((n,t)=>n+t.entries.length,0)}])),
  unresolved:data.report.unresolved,parse_errors:data.report.errors,examples:data.examples,
  verified:['Source workbook SHA256 unchanged','Existing Genshin characters/equipment/sets/calculations unchanged','All written fields match prepared data','Public comparison reads','Three required examples passed before writes'],mode:process.argv.includes('--write')?'write':'verify'};
await writeFile(`${ROOT}/import-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,examples:undefined,unresolved:report.unresolved.length},null,2));
