import { mkdir, writeFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
import { collectGame8Source, parseGame8Cards } from '../src/collectors/game8-collector';
import { fetchGame8Html } from '../src/lib/game8-fetch';
import { createServiceSupabaseClient } from '../src/lib/supabase/service-client';

async function main() {
  const db = createServiceSupabaseClient();
  const { data: sources, error } = await db.from('game_sources').select('*').eq('game_id','wuthering-waves').eq('enabled',true);
  if(error) throw error;
  const report = [];
  for(const source of sources ?? []) {
    if(source.external_ref !== 'game8') continue;
    const html = await fetchGame8Html(source.url!);
    const root = parse(html);
    const items = await collectGame8Source(source);
    const { data: existing, error } = await db.from('news_items').select('content_hash,url').in('content_hash',items.map(i=>i.content_hash));
    if(error) throw error;
    const rows = items.map(i=>({title:i.title,url:i.url,published:i.published_at,confidence:i.publication_date_confidence,quality:i.quality_score,importance:i.importance_score,filter:i.filtering_reason,exists:existing?.some(e=>e.content_hash===i.content_hash)}));
    report.push({source:source.id,bytes:html.length,cards:parseGame8Cards(html,source.url!).length,rows});
    console.log(JSON.stringify(report.at(-1),null,2));
    await mkdir('reports/wuwa-news',{recursive:true});
    await writeFile(`reports/wuwa-news/${source.id}.html`,html);
    console.log('headings',root.querySelectorAll('h2,h3').map(x=>x.textContent));
  }
  await writeFile('reports/wuwa-news/before.json',JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
