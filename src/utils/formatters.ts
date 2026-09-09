export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const FEED_TYPE_SUFFIX = /[\s\-–|]*\b(rss|atom|feed)\b\s*$/i;

/**
 * Public-facing label for a news source. Feed-type tokens and a leading game
 * name are dropped because the game is already shown beside the source.
 */
export function formatSourceLabel(source: string, gameTag?: string) {
  const original = source.trim();
  let label = original;

  while (FEED_TYPE_SUFFIX.test(label)) {
    label = label.replace(FEED_TYPE_SUFFIX, "").trim();
  }

  const tag = gameTag?.trim();
  if (tag && label.toLowerCase().startsWith(tag.toLowerCase())) {
    label = label.slice(tag.length).replace(/^[\s\-–|:]+/, "").trim();
  }

  return label || original;
}

export function formatRelativeTime(value: string) {
  const publishedAt = new Date(value).getTime();
  if (Number.isNaN(publishedAt)) return "Recently";

  const diffMinutes = Math.max(1, Math.round((Date.now() - publishedAt) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)}h ago`;
  if (diffMinutes < 10080) return `${Math.round(diffMinutes / 1440)}d ago`;
  return formatDate(value);
}
