import { parse } from 'node-html-parser';
import type { NewsSourceTrace } from './news-source-trace';

// The official site's initArticleMenuJson/initArticleJson use this public CMS.
const CMS = 'https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en';
type Article = { articleId: number; articleTitle: string; startTime: string; articleContent?: string; articleDesc?: string; suggestCover?: string };

export function parseWuwaMenu(payload: unknown): Article[] {
  if (!Array.isArray(payload) || !payload.length) throw new Error('Kuro article menu is empty or has changed shape');
  for (const row of payload) {
    if (!Number.isInteger(row?.articleId) || !row.articleTitle || !row.startTime) throw new Error('Invalid Kuro article identity/title/date');
  }
  return payload as Article[];
}

export function parseWuwaArticle(article: Article) {
  // CMS wall-clock timestamps are UTC+8, not the collector machine's timezone.
  const date = new Date(article.startTime.replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(article.startTime) ? '' : '+08:00'));
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid Kuro publication date: ${article.articleId}`);
  if (!article.articleContent) throw new Error(`Missing Kuro article content: ${article.articleId}`);
  const root = parse(article.articleContent);
  const image = article.suggestCover || root.querySelector('img[src]')?.getAttribute('src');
  return {
    title: article.articleTitle,
    summary: (article.articleDesc || root.textContent).replace(/\s+/g, ' ').trim().slice(0, 450),
    url: `https://wutheringwaves.kurogames.com/en/main/news/detail/${article.articleId}`,
    imageUrl: image && /^https?:\/\//.test(image) ? image : null,
    imageSource: 'official_article',
    publishedAt: date.toISOString(),
    externalId: String(article.articleId),
  };
}

export async function collectWuwaOfficialSource<T>(create: (input: ReturnType<typeof parseWuwaArticle>) => T | null, trace?: NewsSourceTrace): Promise<T[]> {
  async function json(url: string) {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Kuro CMS returned ${response.status}`);
    if (trace) trace.fetches++;
    return response.json();
  }
  const menu = parseWuwaMenu(await json(`${CMS}/ArticleMenu.json`));
  // Ignore pinned ordering; newest publication dates come first. No per-article IDs are hardcoded.
  const latest = menu.sort((a,b) => b.startTime.localeCompare(a.startTime)).slice(0, 30);
  if (trace) trace.discovered = latest.length;
  const items: T[] = [];
  for (let i=0;i<latest.length;i+=4) {
    await Promise.all(latest.slice(i,i+4).map(async entry => {
      try {
        const detail = await json(`${CMS}/article/${entry.articleId}.json`);
        if (detail.articleId !== entry.articleId) throw new Error(`Kuro detail ID mismatch: ${entry.articleId}`);
        const article = parseWuwaArticle(detail);
        if (new Date(article.publishedAt).getTime() > Date.now()) return;
        const item = create(article);
        if (item) items.push(item);
      } catch (error) {
        const message = `${entry.articleId}: ${error instanceof Error ? error.message : String(error)}`;
        if (!trace) throw error;
        trace.parseErrors.push(message);
      }
    }));
  }
  if (!items.length) throw new Error('Kuro fetched successfully but no valid articles were parsed');
  return items;
}
