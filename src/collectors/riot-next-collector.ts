import type { Database } from "@/types/database";
import { cleanNewsText } from "@/utils/news-normalize";

type GameSourceRow = Database["public"]["Tables"]["game_sources"]["Row"];

type NewsItemInsert = {
  game_id: string | null;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  source_name: string;
  source_type: string;
  published_at: string;
  collected_at: string;
  external_id: string | null;
  content_hash: string;
  tags: string[];
  category: string;
};

type RiotArticle = {
  title?: string;
  publishedAt?: string;
  media?: { url?: string };
  imageMedia?: { url?: string };
  description?: { body?: string };
  product?: { machineName?: string };
  action?: { payload?: { url?: string } };
  analytics?: { contentId?: string; publishDate?: string };
};

const PRODUCT_BY_GAME: Record<string, string> = {
  valorant: "valorant",
  "league-of-legends": "league_of_legends",
};

const FETCH_TIMEOUT_MS = 15000;

function isRiotNextNewsUrl(url: string | null | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "www.leagueoflegends.com" || parsed.hostname === "playvalorant.com") &&
      parsed.pathname.includes("/news")
    );
  } catch {
    return false;
  }
}

export function isRiotNextNewsSource(source: GameSourceRow) {
  return isRiotNextNewsUrl(source.url);
}

function riotImageUrl(article: RiotArticle) {
  const url = article.imageMedia?.url ?? article.media?.url;
  return url?.startsWith("http") ? url : null;
}

function riotSummary(article: RiotArticle) {
  const body = article.description?.body;
  if (!body) return null;
  return cleanNewsText(body.replace(/<[^>]+>/g, " "));
}

function walkRiotArticles(node: unknown, results: RiotArticle[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => walkRiotArticles(item, results));
    return;
  }

  const record = node as RiotArticle;
  if (record.title && record.action?.payload?.url) {
    const href = String(record.action.payload.url);
    if (href.includes("/news/")) {
      results.push(record);
    }
  }

  for (const value of Object.values(node as Record<string, unknown>)) {
    walkRiotArticles(value, results);
  }
}

function matchesGame(article: RiotArticle, gameId: string | null) {
  if (!gameId) return true;
  const expectedProduct = PRODUCT_BY_GAME[gameId];
  if (!expectedProduct) return true;
  return article.product?.machineName === expectedProduct;
}

function resolveArticleUrl(href: string, sourceUrl: string) {
  if (href.startsWith("http")) return href;
  return new URL(href, sourceUrl).toString();
}

export async function collectRiotNextSource(
  source: GameSourceRow,
  createNewsItem: (
    source: GameSourceRow,
    input: {
      title: string;
      summary?: string | null;
      url: string;
      imageUrl?: string | null;
      publishedAt?: string | null;
      externalId?: string | null;
    },
  ) => NewsItemInsert | null,
) {
  if (!source.url) return [];

  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "PlaydexBot/0.1 (+https://github.com/Playdex-tracker/playdex-main)",
      Accept: "text/html",
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Riot news page returned ${response.status}`);
  }

  const html = await response.text();
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!nextMatch?.[1]) {
    throw new Error("Riot news page is missing __NEXT_DATA__");
  }

  const data = JSON.parse(nextMatch[1]) as { props?: { pageProps?: unknown } };
  const articles: RiotArticle[] = [];
  walkRiotArticles(data.props?.pageProps, articles);

  const seen = new Set<string>();
  const candidates: NewsItemInsert[] = [];

  for (const article of articles) {
    if (!matchesGame(article, source.game_id)) continue;

    const href = article.action?.payload?.url;
    const title = cleanNewsText(article.title ?? "");
    if (!href || title.length < 8) continue;

    const url = resolveArticleUrl(href, source.url);
    if (seen.has(url)) continue;
    seen.add(url);

    const item = createNewsItem(source, {
      title,
      summary: riotSummary(article),
      url,
      imageUrl: riotImageUrl(article),
      publishedAt: article.publishedAt ?? article.analytics?.publishDate,
      externalId: article.analytics?.contentId ?? url,
    });

    if (item) candidates.push(item);
  }

  candidates.sort((left, right) => right.published_at.localeCompare(left.published_at));
  return candidates.slice(0, 12);
}
