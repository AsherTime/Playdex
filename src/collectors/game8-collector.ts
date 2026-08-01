import { createHash } from "node:crypto";
import { parse } from "node-html-parser";
import { fetchGame8Html } from "@/lib/game8-fetch";
import type { Database } from "@/types/database";
import { cleanNewsText, normalizeNewsSummary, normalizeNewsTitle } from "@/utils/news-normalize";

type GameSourceRow = Database["public"]["Tables"]["game_sources"]["Row"];

export type Game8NewsItemInsert = {
  game_id: string | null;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  image_source_url: string | null;
  image_match_type: string | null;
  source_name: string;
  source_type: string;
  published_at: string;
  collected_at: string;
  external_id: string | null;
  content_hash: string;
  tags: string[];
  category: string;
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
  const title = normalizeNewsTitle(card.title);
  if (!title) return null;

  const summary = normalizeNewsSummary(card.summary, title, card.title);
  const canonicalUrl = canonicalArticleUrl(card.url);
  const publishedAt = card.publishedAt ? new Date(card.publishedAt) : new Date();
  const safePublishedAt = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

  return {
    game_id: source.game_id,
    title,
    summary,
    url: canonicalUrl,
    image_url: card.imageUrl,
    image_source_url: card.imageSourceUrl,
    image_match_type: card.imageUrl ? "source_page" : null,
    source_name: "Game8",
    source_type: "trusted_site",
    published_at: safePublishedAt.toISOString(),
    collected_at: new Date().toISOString(),
    external_id: canonicalUrl,
    content_hash: contentHash(`trusted_site:${canonicalUrl}`),
    tags: [...(source.tags ?? []), "game8"],
    category: categoryFromTitle(title),
  };
}

export async function collectGame8Source(source: GameSourceRow) {
  if (!source.url) return [];

  const html = await fetchGame8Html(source.url);
  const cards = parseGame8Cards(html, source.url);

  return cards
    .map((card) => toNewsItem(source, card))
    .filter((item): item is Game8NewsItemInsert => Boolean(item));
}
