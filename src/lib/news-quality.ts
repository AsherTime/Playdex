import { cleanNewsText, normalizeNewsTitle } from "@/utils/news-normalize";

export type PublicationDateConfidence = "source" | "article" | "title" | "fallback";
export type NewsCategory =
  | "Update"
  | "Patch"
  | "Release"
  | "Announcement"
  | "Esports"
  | "Collaboration"
  | "DLC / Expansion"
  | "New Character / Content"
  | "Industry"
  | "Other";

export type NewsQualityInput = {
  gameId: string | null;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  sourceType: string;
  tags: string[];
  publishedAt: Date;
  publicationDateConfidence: PublicationDateConfidence;
  imageUrl: string | null;
  imageIsFallback: boolean;
};

export type NewsQualityResult = {
  canonicalUrl: string;
  normalizedTitle: string;
  category: NewsCategory;
  importanceScore: number;
  qualityScore: number;
  homepageEligible: boolean;
  filteringReason: string | null;
};

const POSITIVE_SIGNALS: Array<[RegExp, number, NewsCategory]> = [
  [/\b(version|v\d+(?:\.\d+)?|patch|update|season|episode|act)\b/i, 18, "Patch"],
  [/\b(release date|launch(?:es|ed)?|now available|out now|coming to|pre-order|preorder)\b/i, 22, "Release"],
  [/\b(announc(?:e|ed|ement)|reveals?|showcase|trailer|direct|state of play)\b/i, 18, "Announcement"],
  [/\b(expansion|dlc|major update|new region|new map|new mode)\b/i, 22, "DLC / Expansion"],
  [/\b(new character|new agent|new champion|new hero|banner|playable|roster)\b/i, 18, "New Character / Content"],
  [/\b(collab|collaboration|crossover)\b/i, 18, "Collaboration"],
  [/\b(esports|tournament|championship|finals|masters|worlds|vct|lcs|lec|lck|msi)\b/i, 20, "Esports"],
  [/\b(delay(?:ed)?|shutdown|studio|publisher|acquisition|layoffs?|lawsuit|platform)\b/i, 16, "Industry"],
];

const NEGATIVE_SIGNALS: Array<[RegExp, number, string]> = [
  [/\b(guide|build|tier list|best build|walkthrough|how to|farming|materials|where to find)\b/i, -45, "guide/tutorial content"],
  [/\b(sale|discount|deal|free games?|giveaway|coupon|shop|merch|merchandise)\b/i, -35, "sale/deal content"],
  [/\b(opinion|review|preview|hands-on|list|ranked|every|all .* ranked)\b/i, -25, "opinion/listicle content"],
  [/\b(hotfix|maintenance|known issue|bug fix|server status)\b/i, -18, "minor maintenance content"],
  [/\b(streamer|drama|twitch star|youtuber)\b/i, -30, "creator drama content"],
  [/\b(redeem code|codes?|primogem code|gift code)\b/i, -35, "code/filler content"],
  [/\b(arcade archives|console archives|character trailer|action breakdown|final free dlc)\b/i, -30, "minor release/trailer content"],
];

const TRUSTED_GLOBAL_SOURCES = new Set([
  "PC Gamer",
  "Eurogamer",
  "IGN Games",
  "Video Games Chronicle",
  "Gematsu",
  "Game Informer",
]);

export function canonicalNewsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_)/i.test(param)) {
        url.searchParams.delete(param);
      }
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

export function normalizedTitleKey(value: string) {
  return normalizeNewsTitle(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|for|to|of|and|with|in|on|is|are)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysOld(publishedAt: Date) {
  const ageMs = Date.now() - publishedAt.getTime();
  return Math.max(0, ageMs / 86400000);
}

function sourceBaseScore(input: NewsQualityInput) {
  if (input.tags.includes("official")) return 28;
  if (input.sourceType === "steam") return 22;
  if (TRUSTED_GLOBAL_SOURCES.has(input.sourceName)) return 18;
  if (input.sourceType === "trusted_site") return 6;
  return 10;
}

function freshnessScore(input: NewsQualityInput) {
  if (input.publicationDateConfidence === "fallback") return -35;
  const age = daysOld(input.publishedAt);
  if (age <= 1) return 22;
  if (age <= 2) return 16;
  if (age <= 7) return 8;
  if (age <= 14) return 0;
  return -35;
}

export function classifyNewsCategory(title: string, summary: string): NewsCategory {
  const text = `${title} ${summary}`;
  for (const [pattern, , category] of POSITIVE_SIGNALS) {
    if (pattern.test(text)) return category;
  }
  return "Other";
}

export function scoreNewsItem(input: NewsQualityInput): NewsQualityResult {
  const canonicalUrl = canonicalNewsUrl(input.url);
  const normalizedTitle = cleanNewsText(normalizeNewsTitle(input.title));
  const text = `${normalizedTitle} ${input.summary}`;
  let importanceScore = sourceBaseScore(input) + freshnessScore(input);
  let qualityScore = 68;
  const reasons: string[] = [];

  if (input.gameId) importanceScore += 8;
  if (input.imageUrl && !input.imageIsFallback) {
    importanceScore += 10;
    qualityScore += 8;
  } else {
    qualityScore -= 18;
  }

  for (const [pattern, score] of POSITIVE_SIGNALS) {
    if (pattern.test(text)) importanceScore += score;
  }

  for (const [pattern, score, reason] of NEGATIVE_SIGNALS) {
    if (pattern.test(text)) {
      importanceScore += score;
      qualityScore += Math.round(score / 2);
      reasons.push(reason);
    }
  }

  if (normalizedTitle.length < 18) {
    qualityScore -= 25;
    reasons.push("title too short");
  }
  if (input.publicationDateConfidence === "fallback") {
    reasons.push("missing reliable publication date");
  }

  const category = classifyNewsCategory(normalizedTitle, input.summary);
  const finalImportance = clampScore(importanceScore);
  const finalQuality = clampScore(qualityScore);
  const age = daysOld(input.publishedAt);
  const isGlobal = !input.gameId;
  const homepageImportanceThreshold = isGlobal ? 72 : 55;
  const homepageEligible =
    Boolean(input.imageUrl) &&
    !input.imageIsFallback &&
    input.publicationDateConfidence !== "fallback" &&
    finalImportance >= homepageImportanceThreshold &&
    finalQuality >= 50 &&
    age <= 14 &&
    reasons.length === 0;

  return {
    canonicalUrl,
    normalizedTitle,
    category,
    importanceScore: finalImportance,
    qualityScore: finalQuality,
    homepageEligible,
    filteringReason: homepageEligible ? null : reasons[0] ?? "below homepage threshold",
  };
}
