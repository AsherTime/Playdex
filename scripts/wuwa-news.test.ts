import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverGame8ArticleUrls, parseGame8Article } from '../src/collectors/game8-collector';
import { parseWuwaArticle, parseWuwaMenu } from '../src/collectors/wuwa-official-collector';

test('text-only news buttons are discovered, navigation and foreign-game links are excluded',()=>{
  const urls = discoverGame8ArticleUrls('<nav><a href="/games/Wuthering-Waves/archives/900">Nav</a></nav><div class="archive-style-wrapper"><a class="a-btn" href="/games/Wuthering-Waves/archives/123">New announcement</a><a href="https://bad.example/games/Wuthering-Waves/archives/321">Bad</a><a href="/games/Genshin-Impact/archives/456">Other game</a></div>', 'https://game8.co/games/Wuthering-Waves/archives/100');
  assert.deepEqual(urls,['https://game8.co/games/Wuthering-Waves/archives/123']);
});
test('Game8 uses publication date, never dateModified or collection time',()=>{
  const html='<script type="application/ld+json">'+JSON.stringify({'@type':'Article',headline:'A new update',datePublished:'2026-09-11 23:27:30 -0400',dateModified:'2026-09-15T00:00:00Z'})+'</script>';
  assert.equal(parseGame8Article(html,'https://game8.co/games/Wuthering-Waves/archives/123').publishedAt,'2026-09-12T03:27:30.000Z');
  assert.throws(()=>parseGame8Article(html.replace('datePublished','missing'),'https://game8.co/games/Wuthering-Waves/archives/123'));
});
test('Kuro detail retains identity, article image and deterministic UTC date',()=>{
  const article=parseWuwaArticle({articleId:9999,articleTitle:'Future update',startTime:'2026-09-12 18:00:00',articleContent:'<p>Announcement</p><img src="https://example.com/article.jpg">'});
  assert.equal(article.publishedAt,'2026-09-12T10:00:00.000Z');
  assert.ok(article.url.endsWith('/9999'));
  assert.equal(article.imageUrl,'https://example.com/article.jpg');
});
test('HTTP-success payload without article records is not successful discovery',()=>{
  assert.throws(()=>parseWuwaMenu([]));
  assert.throws(()=>parseWuwaMenu({status:200}));
  assert.throws(()=>discoverGame8ArticleUrls('<html>Challenge</html>','https://game8.co/games/Wuthering-Waves/archives/123'));
});
