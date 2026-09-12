import { createHash } from "node:crypto";
import { parse } from "node-html-parser";
import Parser from "rss-parser";
import { collectGame8Source } from "@/collectors/game8-collector";
import { collectWuwaOfficialSource } from './wuwa-official-collector';
import type { NewsSourceTrace } from './news-source-trace';
import { collectRiotNextSource, isRiotNextNewsSource } from "@/collectors/riot-next-collector";
import { enrichNewsItemImage, extractRssImage, type RssItem } from "@/lib/news-image-extract";
import {
  canonicalNewsUrl,
  normalizedTitleKey,
  scoreNewsItem,
  type PublicationDateConfidence,
} from "@/lib/news-quality";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";
import type { Database } from "@/types/database";
import type { CollectorRunResult } from "@/types/gamedex";
import { cleanNewsText, normalizeNewsSummary, normalizeNewsTitle } from "@/utils/news-normalize";

type GameSourceRow = Database["public"]["Tables"]["game_sources"]["Row"];
type NewsItemInsert = {
  game_id: string | null;
  title: string;
  original_title?: string | null;
  normalized_title?: string | null;
  summary: string;
  url: string;
  canonical_url?: string | null;
  image_url: string | null;
  image_source_url?: string | null;
  image_match_type?: string | null;
  image_source?: string | null;
  image_quality?: number;
  image_is_fallback?: boolean;
  source_name: string;
  source_type: string;
  published_at: string;
  publication_date_confidence?: PublicationDateConfidence;
  collected_at: string;
  external_id: string | null;
  content_hash: string;
  tags: string[];
  category: string;
  importance_score?: number;
  quality_score?: number;
  duplicate_of?: string | null;
  homepage_eligible?: boolean;
  filtering_reason?: string | null;
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

type FinalizeResult = {
  items: NewsItemInsert[];
  filtered: number;
  duplicates: number;
  withoutImages: number;
  homepageEligible: number;
  outcomes: { url: string; stage: string; reason?: string }[];
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
  const lastAttempt = source.last_attempted_at ?? source.last_collected_at;
  if (!lastAttempt) return true;

  const cadenceMinutes = source.cadence_minutes ?? DEFAULT_CADENCE_MINUTES;
  const lastAttemptAt = new Date(lastAttempt).getTime();
  if (Number.isNaN(lastAttemptAt)) return true;

  return Date.now() - lastAttemptAt >= cadenceMinutes * 60 * 1000;
}

async function collectSourcesInParallel(
  sources: GameSourceRow[],
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  errors: CollectorError[],
  collected: NewsItemInsert[],
  traces: NewsSourceTrace[],
  owners: Map<string, Set<string>>,
) {
  const pageCache = new Map<string, Promise<string>>();
  for (let index = 0; index < sources.length; index += SOURCE_CONCURRENCY) {
    const batch = sources.slice(index, index + SOURCE_CONCURRENCY);

    await Promise.all(
      batch.map(async (source) => {
        const trace: NewsSourceTrace = { sourceId: source.id, gameId: source.game_id, fetches: 0, discovered: 0, parsed: 0, known: 0, filtered: 0, inserted: 0, parseErrors: [], articles: [] };
        traces.push(trace);
        try {
          const attemptedAt = new Date().toISOString();
          await supabase
            .from("game_sources")
            .update({
              status: "Delayed",
              last_attempted_at: attemptedAt,
              updated_at: attemptedAt,
            })
            .eq("id", source.id);

          const items = await collectSource(source, trace, pageCache);
          trace.fetches ||= 1;
          trace.parsed = items.length;
          trace.discovered ||= items.length;
          // Check persisted identities before enrichment, so old Steam posts are not rewritten hourly.
          const known = new Set<string>();
          for (let i=0;i<items.length;i+=100) {
            const part = items.slice(i,i+100);
            const {data, error} = await supabase.from('news_items').select('content_hash,url').in('url',part.map(item=>item.url));
            if (error) throw new Error(error.message);
            data?.forEach(row=>known.add(row.url));
          }
          for (const item of items) {
            const exists = known.has(item.url);
            trace.articles.push({url:item.url,title:item.title,stage:exists ? 'known' : 'parsed'});
            if (exists) { trace.known++; continue; }
            const sourceIds = owners.get(item.content_hash) ?? new Set<string>();
            sourceIds.add(source.id);
            owners.set(item.content_hash,sourceIds);
            collected.push(item);
          }
          const completedAt = new Date().toISOString();

          await supabase
            .from("game_sources")
            .update({
              status: "Delayed",
              last_collected_at: completedAt,
              last_attempted_at: attemptedAt,
              last_success_at: completedAt,
              last_error: items.length ? 'Articles parsed; awaiting storage validation' : 'Fetch succeeded but no articles discovered',
              consecutive_failures: 0,
              disabled_reason: null,
              updated_at: completedAt,
            })
            .eq("id", source.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown collector error";
          errors.push({ sourceId: source.id, sourceName: source.name, message });
          trace.parseErrors.push(message);
          const failedAt = new Date().toISOString();

          await supabase
            .from("game_sources")
            .update({
              status: "Error",
              last_attempted_at: failedAt,
              last_error: message,
              consecutive_failures: (source.consecutive_failures ?? 0) + 1,
              updated_at: failedAt,
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

function parsePublishedDate(value: string | null | undefined): {
  date: Date;
  confidence: PublicationDateConfidence;
} {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return { date: parsed, confidence: "source" };
    }
  }

  return { date: new Date(), confidence: "fallback" };
}

function createNewsItem(
  source: GameSourceRow,
  input: {
    title: string;
    summary?: string | null;
    url: string;
    imageUrl?: string | null;
    imageSource?: string | null;
    publishedAt?: string | null;
    publicationDateConfidence?: PublicationDateConfidence;
    externalId?: string | null;
  },
): NewsItemInsert | null {
  const rawTitle = cleanNewsText(input.title);
  const title = normalizeNewsTitle(rawTitle);
  const url = input.url.trim();
  const canonicalUrl = canonicalNewsUrl(url);

  if (!title || !url) return null;

  const summary = normalizeNewsSummary(input.summary, title, rawTitle);
  const parsedDate = parsePublishedDate(input.publishedAt);
  const safePublishedAt = parsedDate.date;
  const publicationDateConfidence = input.publicationDateConfidence ?? parsedDate.confidence;
  const externalId = input.externalId ?? canonicalUrl;
  const imageUrl = input.imageUrl ?? null;
  const scored = scoreNewsItem({
    gameId: source.game_id,
    title,
    summary,
    url: canonicalUrl,
    sourceName: source.name,
    sourceType: source.source_type,
    tags: source.tags ?? [],
    publishedAt: safePublishedAt,
    publicationDateConfidence,
    imageUrl,
    imageIsFallback: false,
  });

  return {
    game_id: source.game_id,
    title,
    original_title: rawTitle,
    normalized_title: scored.normalizedTitle,
    summary,
    url: canonicalUrl,
    canonical_url: canonicalUrl,
    image_url: imageUrl,
    image_source: imageUrl ? input.imageSource ?? "source" : null,
    image_quality: imageUrl ? 75 : 0,
    image_is_fallback: false,
    source_name: source.name,
    source_type: source.source_type,
    published_at: safePublishedAt.toISOString(),
    publication_date_confidence: publicationDateConfidence,
    collected_at: new Date().toISOString(),
    external_id: externalId,
    content_hash: contentHash(`news:${canonicalUrl}`),
    tags: source.tags ?? [],
    category: scored.category,
    importance_score: scored.importanceScore,
    quality_score: scored.qualityScore,
    duplicate_of: null,
    homepage_eligible: scored.homepageEligible,
    filtering_reason: scored.filteringReason,
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
        imageSource: extractRssImage(rssItem, source.url ?? "") ? "rss" : null,
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
        imageSource: null,
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

async function collectSource(source: GameSourceRow, trace: NewsSourceTrace, cache: Map<string, Promise<string>>) {
  if (source.source_type === "trusted_site" || source.external_ref === "game8") {
    return collectGame8Source(source,trace,cache);
  }
  if (source.game_id === 'wuthering-waves' && source.url && new URL(source.url).hostname === 'wutheringwaves.kurogames.com') {
    return collectWuwaOfficialSource(input => createNewsItem(source,input),trace);
  }
  if (isRiotNextNewsSource(source)) {
    return collectRiotNextSource(source, createNewsItem);
  }
  if (source.source_type === "rss") return collectRssSource(source);
  if (source.source_type === "steam") return collectSteamSource(source);
  return collectWebsiteSource(source);
}

function shouldStoreCollectedItem(item: NewsItemInsert) {
  const quality = item.quality_score ?? 0;
  const importance = item.importance_score ?? 0;
  return quality >= 35 && importance >= 25;
}

function withRescoredImage(item: NewsItemInsert): NewsItemInsert {
  const scored = scoreNewsItem({
    gameId: item.game_id,
    title: item.title,
    summary: item.summary,
    url: item.canonical_url ?? item.url,
    sourceName: item.source_name,
    sourceType: item.source_type,
    tags: item.tags,
    publishedAt: new Date(item.published_at),
    publicationDateConfidence: item.publication_date_confidence ?? "fallback",
    imageUrl: item.image_url,
    imageIsFallback: item.image_is_fallback ?? false,
  });

  return {
    ...item,
    canonical_url: scored.canonicalUrl,
    normalized_title: scored.normalizedTitle,
    publication_date_confidence: item.publication_date_confidence ?? "fallback",
    category: scored.category,
    importance_score: scored.importanceScore,
    quality_score: scored.qualityScore,
    homepage_eligible: scored.homepageEligible,
    filtering_reason: scored.filteringReason,
    image_quality: item.image_url ? Math.max(item.image_quality ?? 0, 70) : item.image_quality ?? 0,
  };
}

function duplicateKey(item: NewsItemInsert) {
  const day = item.publication_date_confidence === "fallback" ? "unknown" : item.published_at.slice(0, 10);
  return `${item.game_id ?? "global"}:${day}:${normalizedTitleKey(item.normalized_title ?? item.title)}`;
}

function preferNewsItem(left: NewsItemInsert, right: NewsItemInsert) {
  const leftScore = (left.importance_score ?? 0) + (left.quality_score ?? 0) + (left.tags.includes("official") ? 20 : 0);
  const rightScore = (right.importance_score ?? 0) + (right.quality_score ?? 0) + (right.tags.includes("official") ? 20 : 0);
  return rightScore > leftScore ? right : left;
}

async function finalizeCollectedItems(items: NewsItemInsert[]): Promise<FinalizeResult> {
  const unique = new Map<string, NewsItemInsert>();
  for (const item of items) {
    const previous = unique.get(item.content_hash);
    unique.set(item.content_hash,previous ? preferNewsItem(previous,item) : item);
  }
  const enriched = await Promise.all(
    [...unique.values()].map(async (item) => {
      if (item.source_type === "trusted_site" || item.image_url) {
        return withRescoredImage(item);
      }
      const enrichedItem = await enrichNewsItemImage(item);
      return withRescoredImage({
        ...enrichedItem,
        image_source: enrichedItem.image_url ? "article_meta" : item.image_source,
        image_quality: enrichedItem.image_url ? 70 : item.image_quality,
      });
    }),
  );

  const deduped = new Map<string, NewsItemInsert>();
  const titleDeduped = new Map<string, NewsItemInsert>();
  let filtered = 0;
  let duplicates = items.length - unique.size;

  for (const item of enriched) {
    if (!shouldStoreCollectedItem(item)) {
      filtered += 1;
      continue;
    }

    const titleKey = duplicateKey(item);
    const urlDuplicate = deduped.get(item.content_hash);
    const titleDuplicate = titleDeduped.get(titleKey);

    if (urlDuplicate) {
      deduped.set(item.content_hash, preferNewsItem(urlDuplicate, item));
      duplicates += 1;
      continue;
    }

    if (titleDuplicate) {
      const preferred = preferNewsItem(titleDuplicate, item);
      titleDeduped.set(titleKey, preferred);
      deduped.delete(titleDuplicate.content_hash);
      deduped.set(preferred.content_hash, preferred);
      duplicates += 1;
      continue;
    }

    deduped.set(item.content_hash, item);
    titleDeduped.set(titleKey, item);
  }

  const finalized = [...deduped.values()];
  const storedHashes = new Set(finalized.map(item=>item.content_hash));
  return {
    items: finalized,
    filtered,
    duplicates,
    withoutImages: finalized.filter((item) => !item.image_url).length,
    homepageEligible: finalized.filter((item) => item.homepage_eligible).length,
    outcomes: enriched.filter(item=>!storedHashes.has(item.content_hash)).map(item=>({
      url:item.url, stage:shouldStoreCollectedItem(item) ? 'duplicate' : 'filtered',
      reason:shouldStoreCollectedItem(item) ? 'Duplicate title and publication day' : `${item.filtering_reason ?? 'Below storage threshold'} (quality ${item.quality_score}, importance ${item.importance_score})`,
    })),
  };
}

export async function runNewsCollector(options?: {
  force?: boolean;
  gameId?: string;
  onTrace?: (traces: NewsSourceTrace[]) => void | Promise<void>;
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
      .filter(source => !options?.gameId || source.game_id === options.gameId)
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
    const traces: NewsSourceTrace[] = [];
    const owners = new Map<string, Set<string>>();

    if (sources.length) {
      await collectSourcesInParallel(sources, supabase, errors, collected, traces, owners);
    }

    let insertedRecords = 0;
    let filteredRecords = 0;
    let duplicateRecords = 0;
    let withoutImages = 0;
    let homepageEligible = 0;
    if (collected.length) {
      const finalized = await finalizeCollectedItems(collected);
      filteredRecords = finalized.filtered;
      duplicateRecords = finalized.duplicates;
      withoutImages = finalized.withoutImages;
      homepageEligible = finalized.homepageEligible;
      const finalizedCollected = finalized.items;
      for (const trace of traces) for (const article of trace.articles) {
        if (article.stage === 'known') continue;
        const outcome = finalized.outcomes.find(row=>row.url===article.url);
        if (outcome) Object.assign(article,outcome);
      }

      const { data: upserted, error: upsertError } = finalizedCollected.length ? await supabase
        .from("news_items")
        .upsert(finalizedCollected, { onConflict: "content_hash", ignoreDuplicates: true })
        .select("id,content_hash") : {data: [], error: null};
      let insertedHashes = upserted?.map(row=>row.content_hash) ?? [];

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
            .upsert(fallbackPayload, { onConflict: "content_hash", ignoreDuplicates: true })
            .select("id,content_hash");

          if (retry.error) {
            throw new Error(retry.error.message);
          }

          insertedRecords = retry.data?.length ?? 0;
          insertedHashes = retry.data?.map(row=>row.content_hash) ?? [];
        } else {
          throw new Error(upsertError.message);
        }
      } else {
        insertedRecords = upserted?.length ?? 0;
      }
      for (const item of finalizedCollected) for (const sourceId of owners.get(item.content_hash) ?? []) {
        const trace = traces.find(t=>t.sourceId===sourceId)!;
        const article = trace.articles.find(a=>a.url===item.url)!;
        article.stage = insertedHashes.includes(item.content_hash) ? 'inserted' : 'known';
        if (article.stage === 'inserted') trace.inserted++;
        else trace.known++;
      }
    }

    for (const trace of traces) {
      trace.filtered = trace.articles.filter(article=>article.stage === 'filtered').length;
      if (errors.some(error=>error.sourceId===trace.sourceId)) continue;
      const valid = trace.inserted + trace.known > 0 && !trace.parseErrors.length;
      const completedAt = new Date().toISOString();
      const { error } = await supabase.from('game_sources').update({
        status: valid ? 'Healthy' : 'Delayed',
        last_error: valid ? null : `Fetch succeeded; ${trace.discovered} discovered, ${trace.parsed} parsed, ${trace.filtered} filtered, ${trace.parseErrors.length} parsing errors, ${trace.inserted} inserted`,
        ...(trace.inserted ? { last_item_discovered_at: completedAt } : {}),
        updated_at: completedAt,
      }).eq('id',trace.sourceId);
      if (error) throw new Error(error.message);
      if (trace.parseErrors.length) errors.push({sourceId:trace.sourceId,message:`${trace.parseErrors.length} article parsing failures; see sourceTraces`});
    }
    await options?.onTrace?.(traces);

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
          ? `News collector completed across ${sources.length} source${sources.length === 1 ? "" : "s"} with ${insertedRecords} inserted item${insertedRecords === 1 ? "" : "s"}, ${homepageEligible} homepage eligible, ${filteredRecords} filtered, and ${duplicateRecords} duplicate${duplicateRecords === 1 ? "" : "s"}.`
          : `News collector processed ${processedRecords} item${processedRecords === 1 ? "" : "s"} with ${errors.length} source error${errors.length === 1 ? "" : "s"}, ${filteredRecords} filtered, ${duplicateRecords} duplicate${duplicateRecords === 1 ? "" : "s"}, and ${withoutImages} stored without image${withoutImages === 1 ? "" : "s"}.`;

    await supabase.from("collector_runs").insert({
      collector: "news",
      status,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      processed_records: processedRecords,
      message,
      errors: {
        sourceErrors: errors,
        filteredRecords,
        duplicateRecords,
        withoutImages,
        homepageEligible,
        sourcesChecked: sources.length,
        sourceTraces: traces,
      },
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
