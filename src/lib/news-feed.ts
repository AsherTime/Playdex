import type { Database } from "@/types/database";
import { hasFeedThumbnail } from "@/lib/news-images";

type NewsItemRow = Database["public"]["Tables"]["news_items"]["Row"];

function feedPriority(row: NewsItemRow) {
  if (row.source_type === "trusted_site" || row.source_name === "Game8") return 4;
  if (row.image_url) return 3;
  return 2;
}

export function prioritizeNewsRows<T extends NewsItemRow>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const priorityDiff = feedPriority(right) - feedPriority(left);
    if (priorityDiff !== 0) return priorityDiff;
    return right.published_at.localeCompare(left.published_at);
  });
}

/** Feed surfaces only show articles with a real remote thumbnail. */
export function filterFeedNewsRows<T extends NewsItemRow>(rows: T[]) {
  return rows.filter((row) => hasFeedThumbnail(row.image_url));
}

function perGameCap(limit: number, gameCount: number) {
  if (gameCount <= 1) return limit;
  return Math.max(2, Math.ceil(limit / gameCount));
}

/** Round-robin interleave so no single game or source dominates the feed. */
export function balanceFeedRows<T extends NewsItemRow>(rows: T[], limit: number, maxPerGame?: number) {
  const ranked = prioritizeNewsRows(filterFeedNewsRows(rows));
  if (!ranked.length) return [];

  const byGame = new Map<string, T[]>();
  for (const row of ranked) {
    const gameId = row.game_id ?? "unknown";
    const bucket = byGame.get(gameId);
    if (bucket) bucket.push(row);
    else byGame.set(gameId, [row]);
  }

  const gameIds = [...byGame.keys()];
  const cap = maxPerGame ?? perGameCap(limit, gameIds.length);
  const picked = new Map<string, number>();
  const result: T[] = [];

  while (result.length < limit) {
    let added = false;
    for (const gameId of gameIds) {
      if (result.length >= limit) break;

      const used = picked.get(gameId) ?? 0;
      if (used >= cap) continue;

      const next = byGame.get(gameId)?.[used];
      if (!next) continue;

      result.push(next);
      picked.set(gameId, used + 1);
      added = true;
    }

    if (!added) break;
  }

  return result;
}

export function prepareFeedRows<T extends NewsItemRow>(
  rows: T[],
  limit: number,
  options?: { balanced?: boolean; maxPerGame?: number },
) {
  if (options?.balanced === false) {
    return prioritizeNewsRows(filterFeedNewsRows(rows)).slice(0, limit);
  }
  return balanceFeedRows(rows, limit, options?.maxPerGame);
}
