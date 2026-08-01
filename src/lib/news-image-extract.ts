import { parse } from "node-html-parser";
import type Parser from "rss-parser";

const USER_AGENT = "PlaydexBot/0.1 (+https://github.com/Playdex-tracker/playdex-main)";
export const ARTICLE_FETCH_TIMEOUT_MS = 10000;
const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)(\?|$)/i;
const SKIP_IMAGE_HINTS =
  /(?:favicon|sprite|pixel|tracking|avatar|emoji|badge|icon|logo|spacer|blank|1x1|analytics|beacon)/i;

type RssMediaNode = {
  $?: {
    url?: string;
    type?: string;
  };
};

export type RssItem = Parser.Item & {
  mediaContent?: RssMediaNode | RssMediaNode[];
  mediaThumbnail?: RssMediaNode | RssMediaNode[];
  "content:encoded"?: string;
};

export function absoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

export function looksLikeImageUrl(value: string | undefined | null) {
  if (!value) return false;
  if (value.startsWith("data:")) return false;
  return IMAGE_EXTENSIONS.test(value) || value.includes("/image") || value.includes("/img");
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyArticleImage(
  src: string,
  attrs: { width?: string | null; height?: string | null; className?: string | null; alt?: string | null } = {},
) {
  if (!isHttpUrl(src)) return false;
  if (SKIP_IMAGE_HINTS.test(src)) return false;

  const className = attrs.className ?? "";
  const alt = attrs.alt ?? "";
  if (SKIP_IMAGE_HINTS.test(className) || SKIP_IMAGE_HINTS.test(alt)) return false;

  const width = Number.parseInt(attrs.width ?? "", 10);
  const height = Number.parseInt(attrs.height ?? "", 10);
  if ((width > 0 && width < 80) || (height > 0 && height < 80)) return false;

  return looksLikeImageUrl(src) || src.includes("cdn") || src.includes("cloudfront") || src.includes("akamai");
}

function firstMediaUrl(node: RssMediaNode | RssMediaNode[] | undefined) {
  const entries = Array.isArray(node) ? node : node ? [node] : [];
  for (const entry of entries) {
    const url = entry.$?.url;
    if (url && looksLikeImageUrl(url)) return url;
  }
  return null;
}

function imageFromHtml(value: string | undefined | null, baseUrl?: string) {
  if (!value) return null;

  const match = value.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return null;

  const resolved = baseUrl ? absoluteUrl(match[1], baseUrl) : match[1];
  return isLikelyArticleImage(resolved) ? resolved : null;
}

function metaImage(root: ReturnType<typeof parse>, pageUrl: string) {
  const selectors: Array<[string, string]> = [
    ['meta[property="og:image:secure_url"]', "content"],
    ['meta[property="og:image"]', "content"],
    ['meta[name="twitter:image"]', "content"],
    ['meta[name="twitter:image:src"]', "content"],
    ['meta[itemprop="image"]', "content"],
    ['meta[name="thumbnail"]', "content"],
    ['link[rel="image_src"]', "href"],
  ];

  for (const [selector, attribute] of selectors) {
    const value = root.querySelector(selector)?.getAttribute(attribute);
    if (!value) continue;

    const resolved = absoluteUrl(value, pageUrl);
    if (isLikelyArticleImage(resolved)) return resolved;
  }

  return null;
}

function firstArticleImage(root: ReturnType<typeof parse>, pageUrl: string) {
  const scopes = ["article img", "main img", '[role="main"] img', ".article img", ".content img", "img"];

  for (const selector of scopes) {
    for (const img of root.querySelectorAll(selector)) {
      const src =
        img.getAttribute("src") ??
        img.getAttribute("data-src") ??
        img.getAttribute("data-lazy-src") ??
        img.getAttribute("data-original");

      if (!src || src.startsWith("data:")) continue;

      const resolved = absoluteUrl(src, pageUrl);
      if (
        isLikelyArticleImage(resolved, {
          width: img.getAttribute("width"),
          height: img.getAttribute("height"),
          className: img.getAttribute("class"),
          alt: img.getAttribute("alt"),
        })
      ) {
        return resolved;
      }
    }
  }

  return null;
}

export function extractImageFromHtml(html: string, pageUrl: string) {
  const root = parse(html);
  return metaImage(root, pageUrl) ?? firstArticleImage(root, pageUrl);
}

export async function fetchArticleImage(articleUrl: string) {
  try {
    const response = await fetch(articleUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(ARTICLE_FETCH_TIMEOUT_MS),
      redirect: "follow",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await response.text();
    return extractImageFromHtml(html, articleUrl);
  } catch {
    return null;
  }
}

export function extractRssImage(item: RssItem, baseUrl: string) {
  if (item.enclosure?.url && looksLikeImageUrl(item.enclosure.url)) {
    return absoluteUrl(item.enclosure.url, baseUrl);
  }

  const mediaUrl = firstMediaUrl(item.mediaContent) ?? firstMediaUrl(item.mediaThumbnail);
  if (mediaUrl) return absoluteUrl(mediaUrl, baseUrl);

  const htmlImage =
    imageFromHtml(item["content:encoded"], baseUrl) ??
    imageFromHtml(item.content, baseUrl) ??
    imageFromHtml(item.summary, baseUrl);

  return htmlImage ? absoluteUrl(htmlImage, baseUrl) : null;
}

export async function enrichNewsItemImage<T extends { url: string; image_url: string | null }>(item: T) {
  if (item.image_url || !item.url) return item;

  const imageUrl = await fetchArticleImage(item.url);
  return imageUrl ? { ...item, image_url: imageUrl } : item;
}
