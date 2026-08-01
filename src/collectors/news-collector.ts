import { createHash } from "node:crypto";
import { parse } from "node-html-parser";
import Parser from "rss-parser";
import { collectGame8Source } from "@/collectors/game8-collector";
import { collectRiotNextSource, isRiotNextNewsSource } from "@/collectors/riot-next-collector";
import { enrichNewsItemImage, extractRssImage, type RssItem } from "@/lib/news-image-extract";
import { isGachaGame } from "@/lib/gacha-games";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";
import type { Database } from "@/types/database";
import type { CollectorRunResult } from "@/types/gamedex";
import { cleanNewsText, normalizeNewsSummary, normalizeNewsTitle } from "@/utils/news-normalize";

type GameSourceRow = Database["public"]["Tables"]["game_sources"]["Row"];
type NewsItemInsert = {
  game_id: string | null;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  image_source_url?: string | null;
  image_match_type?: string | null;
  source_name: string;
  source_type: string;
  published_at: string;
  collected_at: string;
  external_id: string | null;
  content_hash: string;
  tags: string[];
  category: string;
};

type CollectorError = {
  sourceId?: string;
  sourceName?: string;
  message: string;
};

type SteamNewsItem = {
  gid?: string;
  title?: string;
  url?: string;
  contents?: string;
  date?: number;
};

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

const FETCH_TIMEOUT_MS = 15000;
const SOURCE_CONCURRENCY = 4;
const DEFAULT_CADENCE_MINUTES = 720;

function isSourceDue(source: GameSourceRow, force: boolean) {
  if (force) return true;
  if (!source.last_collected_at) return true;

  const cadenceMinutes = source.cadence_minutes ?? DEFAULT_CADENCE_MINUTES;
  const lastCollectedAt = new Date(source.last_collected_at).getTime();
  if (Number.isNaN(lastCollectedAt)) return true;

  return Date.now() - lastCollectedAt >= cadenceMinutes * 60 * 1000;
}

async function collectSourcesInParallel(
  sources: GameSourceRow[],
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  errors: CollectorError[],
  collected: NewsItemInsert[],
) {
  for (let index = 0; index < sources.length; index += SOURCE_CONCURRENCY) {
    const batch = sources.slice(index, index + SOURCE_CONCURRENCY);

    await Promise.all(
      batch.map(async (source) => {
        try {
          const items = await collectSource(source);
          collected.push(...items);

          await supabase
            .from("game_sources")
            .update({
              status: "Healthy",
              last_collected_at: new Date().toISOString(),
              last_error: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", source.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown collector error";
          errors.push({ sourceId: source.id, sourceName: source.name, message });

          await supabase
            .from("game_sources")
            .update({
              status: "Error",
              last_collected_at: new Date().toISOString(),
              last_error: message,
              updated_at: new Date().toISOString(),
            })
            .eq("id", source.id);
        }
      }),
    );
  }
}

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

function categoryFromTitle(title: string): NewsItemInsert["category"] {
  const lower = title.toLowerCase();
  if (lower.includes("esports") || lower.includes("tournament") || lower.includes("champions")) return "Esports";
  if (lower.includes("release") || lower.includes("launch")) return "Release";
  if (lower.includes("community")) return "Community";
  if (lower.includes("rumor")) return "Rumor";
  return "Update";
}

function createNewsItem(
  source: GameSourceRow,
  input: {
    title: string;
    summary?: string | null;
    url: string;
    imageUrl?: string | null;
    publishedAt?: string | null;
    externalId?: string | null;
  },
): NewsItemInsert | null {
  const rawTitle = cleanNewsText(input.title);
  const title = normalizeNewsTitle(rawTitle);
  const url = input.url.trim();

  if (!title || !url) return null;

  const summary = normalizeNewsSummary(input.summary, title, rawTitle);
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
  const safePublishedAt = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt;
  const externalId = input.externalId ?? url;

  return {
    game_id: source.game_id,
    title,
    summary,
    url,
    image_url: input.imageUrl ?? null,
    source_name: source.name,
    source_type: source.source_type,
    published_at: safePublishedAt.toISOString(),
    collected_at: new Date().toISOString(),
    external_id: externalId,
    content_hash: contentHash(`${source.id}:${externalId}:${url}`),
    tags: source.tags ?? [],
    category: categoryFromTitle(title),
  };
}

async function collectRssSource(source: GameSourceRow) {
  if (!source.url) return [];

  const feed = await rssParser.parseURL(source.url);

  return feed.items
    .slice(0, 12)
    .map((item) => {
      const rssItem = item as RssItem;

      return createNewsItem(source, {
        title: item.title ?? "",
        summary: item.contentSnippet ?? item.content ?? item.summary,
        url: item.link ? absoluteUrl(item.link, source.url ?? "") : "",
        imageUrl: extractRssImage(rssItem, source.url ?? ""),
        publishedAt: item.isoDate ?? item.pubDate,
        externalId: item.guid ?? item.link,
      });
    })
    .filter(Boolean) as NewsItemInsert[];
}

async function collectSteamSource(source: GameSourceRow) {
  const appId = source.external_ref;
  if (!appId) return [];

  const response = await fetch(
    `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${encodeURIComponent(appId)}&count=12&maxlength=500&format=json`,
    { next: { revalidate: 0 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  );

  if (!response.ok) {
    throw new Error(`Steam returned ${response.status}`);
  }

  const payload = (await response.json()) as { appnews?: { newsitems?: SteamNewsItem[] } };
  const newsItems = payload.appnews?.newsitems ?? [];

  return newsItems
    .map((item) =>
      createNewsItem(source, {
        title: item.title ?? "",
        summary: item.contents,
        url: item.url ?? "",
        publishedAt: item.date ? new Date(item.date * 1000).toISOString() : null,
        externalId: item.gid ?? item.url,
      }),
    )
    .filter(Boolean) as NewsItemInsert[];
}

function websiteAnchorTitle(anchor: ReturnType<ReturnType<typeof parse>["querySelectorAll"]>[number]) {
  return cleanNewsText(
    anchor.getAttribute("aria-label") ?? anchor.getAttribute("title") ?? anchor.textContent ?? "",
  );
}

async function collectWebsiteSource(source: GameSourceRow) {
  if (!source.url) return [];

  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "PlaydexBot/0.1 (+https://github.com/Playdex-tracker/playdex-main)",
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Website returned ${response.status}`);
  }

  const html = await response.text();
  const root = parse(html);
  const seen = new Set<string>();
  const candidates: NewsItemInsert[] = [];

  for (const anchor of root.querySelectorAll("a")) {
    const href = anchor.getAttribute("href");
    if (!href) continue;

    const url = absoluteUrl(href, source.url ?? "");
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const lowerUrl = url.toLowerCase();
    const sourcePath = new URL(source.url ?? "https://example.com").pathname.toLowerCase();
    const looksLikeArticle =
      lowerUrl.includes("/news") ||
      lowerUrl.includes("/article") ||
      lowerUrl.includes("/articles") ||
      lowerUrl.includes(sourcePath);

    if (!looksLikeArticle || url === source.url) continue;

    const title = websiteAnchorTitle(anchor);
    if (title.length < 12) continue;

    const item = createNewsItem(source, {
      title,
      summary: null,
      url,
      externalId: url,
    });

    if (item) candidates.push(item);
    if (candidates.length >= 12) break;
  }

  const enriched = await Promise.all(
    candidates.map((item) => enrichNewsItemImage(item)),
  );

  return enriched;
}

async function collectSource(source: GameSourceRow) {
  if (source.source_type === "trusted_site" || source.external_ref === "game8") {
    return collectGame8Source(source);
  }
  if (isRiotNextNewsSource(source)) {
    return collectRiotNextSource(source, createNewsItem);
  }
  if (source.source_type === "rss") return collectRssSource(source);
  if (source.source_type === "steam") return collectSteamSource(source);
  return collectWebsiteSource(source);
}

function shouldKeepCollectedItem(item: NewsItemInsert) {
  if (isGachaGame(item.game_id) && item.source_type === "rss" && !item.image_url) {
    return false;
  }
  return true;
}

async function finalizeCollectedItems(items: NewsItemInsert[]) {
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item.source_type === "trusted_site" || item.image_url) {
        return item;
      }
      return enrichNewsItemImage(item);
    }),
  );

  const deduped = new Map<string, NewsItemInsert>();
  for (const item of enriched) {
    if (!shouldKeepCollectedItem(item)) continue;
    deduped.set(item.content_hash, item);
  }

  return [...deduped.values()];
}

export async function runNewsCollector(options?: {
  force?: boolean;
}): Promise<CollectorRunResult> {
  const startedAt = new Date().toISOString();
  const force = options?.force ?? false;

  try {
    const supabase = createServiceSupabaseClient();
    const { data: sourceRows, error: sourcesError } = await supabase.from("game_sources").select("*").eq("enabled", true);

    if (sourcesError) {
      throw new Error(sourcesError.message);
    }

    const sources = (sourceRows ?? [])
      .filter(
        (source) =>
          source.source_type === "trusted_site" ||
          source.external_ref === "game8" ||
          source.source_type === "rss" ||
          source.source_type === "website" ||
          source.source_type === "steam",
      )
      .filter((source) => isSourceDue(source, force));

    const errors: CollectorError[] = [];
    const collected: NewsItemInsert[] = [];

    if (sources.length) {
      await collectSourcesInParallel(sources, supabase, errors, collected);
    }

    let insertedRecords = 0;
    if (collected.length) {
      const finalizedCollected = await finalizeCollectedItems(collected);

      const { data: upserted, error: upsertError } = await supabase
        .from("news_items")
        .upsert(finalizedCollected, { onConflict: "content_hash" })
        .select("id");

      if (upsertError) {
        const missingOptionalColumns =
          upsertError.message.includes("image_source_url") || upsertError.message.includes("image_match_type");
        if (missingOptionalColumns) {
          const fallbackPayload = finalizedCollected.map((item) => {
            const copy = { ...item };
            delete copy.image_source_url;
            delete copy.image_match_type;
            return copy;
          });
          const retry = await supabase
            .from("news_items")
            .upsert(fallbackPayload, { onConflict: "content_hash" })
            .select("id");

          if (retry.error) {
            throw new Error(retry.error.message);
          }

          insertedRecords = retry.data?.length ?? 0;
        } else {
          throw new Error(upsertError.message);
        }
      } else {
        insertedRecords = upserted?.length ?? 0;
      }
    }

    const processedRecords = collected.length;
    const status =
      !sources.length && !errors.length
        ? "completed"
        : errors.length && processedRecords === 0
          ? "failed"
          : errors.length
            ? "partial"
            : "completed";
    const message =
      !sources.length
        ? "No sources were due for collection."
        : status === "completed"
          ? `News collector completed across ${sources.length} source${sources.length === 1 ? "" : "s"} with ${insertedRecords} new item${insertedRecords === 1 ? "" : "s"}.`
          : `News collector processed ${processedRecords} item${processedRecords === 1 ? "" : "s"} with ${errors.length} source error${errors.length === 1 ? "" : "s"}.`;

    await supabase.from("collector_runs").insert({
      collector: "news",
      status,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      processed_records: processedRecords,
      message,
      errors,
    });

    return {
      collector: "news",
      status,
      collectedAt: new Date().toISOString(),
      processedRecords,
      message,
      errors: errors.map((error) => `${error.sourceName ?? error.sourceId}: ${error.message}`),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown collector failure";

    try {
      const supabase = createServiceSupabaseClient();
      await supabase.from("collector_runs").insert({
        collector: "news",
        status: "failed",
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        processed_records: 0,
        message,
        errors: [{ message }],
      });
    } catch {
      // If the schema is not applied yet, the API response below is still useful.
    }

    return {
      collector: "news",
      status: "failed",
      collectedAt: new Date().toISOString(),
      processedRecords: 0,
      message,
      errors: [message],
    };
  }
}
