import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { runNewsCollector } from '../src/collectors/news-collector';
import { createServiceSupabaseClient } from '../src/lib/supabase/service-client';

async function main() {
  const db = createServiceSupabaseClient();
  const before = await db.from('news_items').select('id,collected_at').eq('game_id','wuthering-waves');
  if (before.error) throw before.error;
  await mkdir('reports/wuwa-news',{recursive:true});
  for (const pass of process.argv.includes('--once') ? ['verified'] : ['verified','verified-repeat']) {
    const sourcesBefore = await db.from('game_sources').select('id,last_item_discovered_at').eq('game_id','wuthering-waves');
    if (sourcesBefore.error) throw sourcesBefore.error;
    const started = Date.now();
    let inserted = 0;
    const result = await runNewsCollector({force:true,gameId:'wuthering-waves',onTrace: async traces=>{
      inserted = traces.reduce((sum,trace)=>sum+trace.inserted,0);
      for (const trace of traces) assert.ok(trace.filtered+trace.known+trace.inserted <= trace.parsed,'Invalid stage counters');
      await writeFile(`reports/wuwa-news/${pass}-trace.json`,JSON.stringify(traces,null,2));
      console.log(JSON.stringify(traces.map(({articles,...trace})=>({...trace,articles:articles.filter(a=>a.stage==='inserted')})),null,2));
    }});
    console.log(result);
    console.log(`Elapsed: ${Date.now()-started}ms`);
    assert.notEqual(result.status,'failed',result.message);
    if (!inserted) {
      const sourcesAfter = await db.from('game_sources').select('id,last_item_discovered_at').eq('game_id','wuthering-waves');
      if (sourcesAfter.error) throw sourcesAfter.error;
      for (const source of sourcesBefore.data) assert.equal(sourcesAfter.data.find(row=>row.id===source.id)?.last_item_discovered_at,source.last_item_discovered_at,'Discovery timestamp changed with no new rows');
    }
  }
  const after = await db.from('news_items').select('id,collected_at').eq('game_id','wuthering-waves');
  if(after.error) throw after.error;
  for(const previous of before.data) assert.equal(after.data.find(row=>row.id===previous.id)?.collected_at,previous.collected_at,'Existing article rewritten');
  console.log('PASS: Existing news timestamps unchanged');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
