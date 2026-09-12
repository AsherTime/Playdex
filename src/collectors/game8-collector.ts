import { createHash } from "node:crypto";
import { parse } from "node-html-parser";
import { fetchGame8Html } from "@/lib/game8-fetch";
import { canonicalNewsUrl, scoreNewsItem, type PublicationDateConfidence } from "@/lib/news-quality";
import type { Database } from "@/types/database";
import { cleanNewsText, normalizeNewsSummary, normalizeNewsTitle } from "@/utils/news-normalize";
import type { NewsSourceTrace } from './news-source-trace';

type GameSourceRow = Database["public"]["Tables"]["game_sources"]["Row"];

export type Game8NewsItemInsert = {
  game_id: string | null;
  title: string;
  original_title: string | null;
  normalized_title: string | null;
  summary: string;
  url: string;
  canonical_url: string | null;
  image_url: string | null;
  image_source_url: string | null;
  image_match_type: string | null;
  image_source: string | null;
  image_quality: number;
  image_is_fallback: boolean;
  source_name: string;
  source_type: string;
  published_at: string;
  publication_date_confidence: PublicationDateConfidence;
  collected_at: string;
  external_id: string | null;
  content_hash: string;
  tags: string[];
  category: string;
  importance_score: number;
  quality_score: number;
  duplicate_of: string | null;
  homepage_eligible: boolean;
  filtering_reason: string | null;
};

export type ParsedGame8Card = {
  title: string;
  url: string;
  imageUrl: string | null;
  summary: string | null;
  publishedAt: string | null;
  imageSourceUrl: string;
};

function contentHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function absoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

export function canonicalArticleUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function normalizeImageUrl(value: string | null | undefined, baseUrl: string) {
  if (!value || value.startsWith("data:")) return null;

  const resolved = absoluteUrl(value, baseUrl);
  if (!resolved.startsWith("http")) return null;

  return resolved.replace(/\/thumb(\?|$)/, "/show$1");
}

function parseGame8Date(value: string | null | undefined) {
  if (!value) return null;

  const updatedMatch = value.match(/Updated\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (updatedMatch) {
    const parsed = new Date(updatedMatch[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const longMatch = value.match(/Last updated on:\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (longMatch) {
    const parsed = new Date(longMatch[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const isoMatch = value.match(/\d{4}-\d{2}-\d{2}T[\d:.+-]+/);
  if (isoMatch) {
    const parsed = new Date(isoMatch[0]);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null;
}

function cardTitleFromAnchor(anchor: ReturnType<ReturnType<typeof parse>["querySelector"]>, fallback: string) {
  const img = anchor?.querySelector("img");
  const alt = cleanNewsText(img?.getAttribute("alt"));
  const text = cleanNewsText(anchor?.textContent);

  if (alt && alt.length >= 8) return normalizeNewsTitle(alt);
  if (text && text.length >= 8) return normalizeNewsTitle(text);
  return normalizeNewsTitle(fallback);
}

export function parseGame8Cards(html: string, pageUrl: string): ParsedGame8Card[] {
  const root = parse(html);
  const cards: ParsedGame8Card[] = [];
  const seen = new Set<string>();

  const pushCard = (card: ParsedGame8Card) => {
    const canonical = canonicalArticleUrl(card.url);
    if (!card.title || !canonical || seen.has(canonical)) return;
    seen.add(canonical);
    cards.push({ ...card, url: canonical });
  };

  for (const item of root.querySelectorAll("li.a-cardLinkListItem")) {
    const anchor = item.querySelector("a");
    const href = anchor?.getAttribute("href");
    const url = href ? absoluteUrl(href, pageUrl) : "";
    if (!url.includes("/archives/")) continue;

    const title = cleanNewsText(item.querySelector(".a-cardLinkListItem__title")?.textContent);
    const summary = cleanNewsText(item.querySelector(".a-cardLinkListItem__text")?.textContent);
    const dateText = cleanNewsText(item.querySelector(".a-cardLinkListItem__date")?.textContent);
    const img = item.querySelector("img[data-src], img[src]");
    const imageUrl = normalizeImageUrl(img?.getAttribute("data-src") ?? img?.getAttribute("src"), pageUrl);

    if (!title) continue;

    pushCard({
      title: normalizeNewsTitle(title),
      url,
      imageUrl,
      summary: summary || null,
      publishedAt: parseGame8Date(dateText),
      imageSourceUrl: url,
    });
  }

  for (const anchor of root.querySelectorAll("a.a-link")) {
    const href = anchor.getAttribute("href");
    const url = href ? absoluteUrl(href, pageUrl) : "";
    if (!url.includes("/archives/")) continue;

    const img = anchor.querySelector("img.a-img");
    if (!img) continue;

    const width = Number.parseInt(img.getAttribute("width") ?? "0", 10);
    if (width > 0 && width < 120) continue;

    const className = img.getAttribute("class") ?? "";
    if (!className.includes("lazy-non-square") && width > 0 && width < 400) continue;

    const imageUrl = normalizeImageUrl(img.getAttribute("data-src") ?? img.getAttribute("src"), pageUrl);
    if (!imageUrl) continue;

    const title = cardTitleFromAnchor(anchor, url);
    if (!title) continue;

    pushCard({
      title,
      url,
      imageUrl,
      summary: null,
      publishedAt: null,
      imageSourceUrl: url,
    });
  }

  return cards;
}

function categoryFromTitle(title: string): Game8NewsItemInsert["category"] {
  const lower = title.toLowerCase();
  if (lower.includes("banner") || lower.includes("wish") || lower.includes("signal search")) return "Update";
  if (lower.includes("event")) return "Update";
  if (lower.includes("release") || lower.includes("version")) return "Release";
  if (lower.includes("code")) return "Update";
  return "Update";
}

function toNewsItem(source: GameSourceRow, card: ParsedGame8Card): Game8NewsItemInsert | null {
  const originalTitle = cleanNewsText(card.title);
  const title = normalizeNewsTitle(originalTitle);
  if (!title) return null;

  const summary = normalizeNewsSummary(card.summary, title, card.title);
  const canonicalUrl = canonicalNewsUrl(canonicalArticleUrl(card.url));
  const publishedAt = card.publishedAt ? new Date(card.publishedAt) : new Date();
  const safePublishedAt = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt;
  const publicationDateConfidence: PublicationDateConfidence =
    card.publishedAt && !Number.isNaN(new Date(card.publishedAt).getTime()) ? "source" : "fallback";
  const tags = [...(source.tags ?? []), "game8"];
  const scored = scoreNewsItem({
    gameId: source.game_id,
    title,
    summary,
    url: canonicalUrl,
    sourceName: "Game8",
    sourceType: "trusted_site",
    tags,
    publishedAt: safePublishedAt,
    publicationDateConfidence,
    imageUrl: card.imageUrl,
    imageIsFallback: false,
  });

  return {
    game_id: source.game_id,
    title,
    original_title: originalTitle,
    normalized_title: scored.normalizedTitle,
    summary,
    url: canonicalUrl,
    canonical_url: canonicalUrl,
    image_url: card.imageUrl,
    image_source_url: card.imageSourceUrl,
    image_match_type: card.imageUrl ? "source_page" : null,
    image_source: card.imageUrl ? "source_page" : null,
    image_quality: card.imageUrl ? 70 : 0,
    image_is_fallback: false,
    source_name: "Game8",
    source_type: "trusted_site",
    published_at: safePublishedAt.toISOString(),
    publication_date_confidence: publicationDateConfidence,
    collected_at: new Date().toISOString(),
    external_id: canonicalUrl,
    content_hash: contentHash(`news:${canonicalUrl}`),
    tags,
    category: scored.category || categoryFromTitle(title),
    importance_score: scored.importanceScore,
    quality_score: scored.qualityScore,
    duplicate_of: null,
    homepage_eligible: scored.homepageEligible,
    filtering_reason: scored.filteringReason,
  };
}

export function discoverGame8ArticleUrls(html: string, pageUrl: string) {
  const root = parse(html);
  const content = root.querySelector('.archive-style-wrapper');
  if (!content) throw new Error('Game8 article content container missing');
  const page = new URL(pageUrl);
  const gamePath = page.pathname.split('/archives/')[0] + '/archives/';
  return [...new Set(content.querySelectorAll('a[href]').map(a => canonicalArticleUrl(absoluteUrl(a.getAttribute('href')!,pageUrl))))]
    .filter(value => {
      try {
        const u = new URL(value);
        return u.origin === page.origin && u.pathname.startsWith(gamePath) && /\/archives\/\d+$/.test(u.pathname) && value !== canonicalArticleUrl(pageUrl);
      } catch { return false; }
    })
    .sort((a,b) => Number(b.split('/').at(-1)) - Number(a.split('/').at(-1))).slice(0,40);
}

export function parseGame8Article(html: string, pageUrl: string): ParsedGame8Card {
  const root = parse(html);
  const objects: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    const row = value as Record<string,unknown>;
    if (['Article','NewsArticle','BlogPosting'].includes(String(row['@type']))) objects.push(row);
    if (row['@graph']) visit(row['@graph']);
  };
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try { visit(JSON.parse(script.textContent)); } catch { /* Other widgets may have invalid JSON-LD. */ }
  }
  const article = objects.find(a => canonicalArticleUrl(String(a.url ?? pageUrl)) === canonicalArticleUrl(pageUrl));
  const published = article && typeof article.datePublished === 'string' ? new Date(article.datePublished) : null;
  if (!article || !article.headline || !published || !Number.isFinite(published.getTime())) throw new Error('Game8 article lacks reliable publication metadata');
  const image = typeof article.image === 'string' ? article.image : root.querySelector('meta[property="og:image"]')?.getAttribute('content');
  return { title: cleanNewsText(String(article.headline)), url: canonicalArticleUrl(pageUrl),
    summary: cleanNewsText(String(article.description ?? '')), publishedAt: published.toISOString(),
    imageUrl: normalizeImageUrl(image,pageUrl), imageSourceUrl: pageUrl };
}

export async function collectGame8Source(source: GameSourceRow, trace?: NewsSourceTrace, cache = new Map<string, Promise<string>>()) {
  if (!source.url) return [];

  if (source.game_id === 'wuthering-waves') {
    const get = (url: string) => {
      if (!cache.has(url)) cache.set(url, fetchGame8Html(url));
      return cache.get(url)!;
    };
    const html = await get(source.url);
    if (trace) trace.fetches++;
    const urls = discoverGame8ArticleUrls(html,source.url);
    if (trace) trace.discovered = urls.length;
    const items: Game8NewsItemInsert[] = [];
    for (let i=0;i<urls.length;i+=4) {
      await Promise.all(urls.slice(i,i+4).map(async url => {
        try {
          const articleHtml = await get(url);
          if (trace) trace.fetches++;
          const card = parseGame8Article(articleHtml,url);
          if (new Date(card.publishedAt!).getTime() > Date.now()) return;
          const item = toNewsItem(source,card);
          if(item) items.push(item);
        } catch(error) {
          if (!trace) throw error;
          trace.parseErrors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }));
    }
    if (!items.length) throw new Error('Game8 fetched successfully but no valid articles were parsed');
    return items;
  }
  const html = await fetchGame8Html(source.url);
  const cards = parseGame8Cards(html, source.url);

  return cards
    .map((card) => toNewsItem(source, card))
    .filter((item): item is Game8NewsItemInsert => Boolean(item));
}
