import {
  ANDROID_TRACKED_GAMES,
  findTrackedGameByPackage,
  getVerifiedTrackedPackageIds,
} from "@/data/android-tracked-games";
import { formatPlaytimeMs } from "@/lib/game-usage/format";
import type {
  GameUsageQueryResult,
  GameUsageRecord,
  NormalizedGameUsage,
} from "@/lib/game-usage/types";

function aggregateRecordsBySlug(
  records: GameUsageRecord[],
  periodStart: number,
  periodEnd: number,
): NormalizedGameUsage[] {
  const bySlug = new Map<
    string,
    {
      gameName: string;
      packageName: string;
      foregroundMs: number;
      lastUsed: number;
      sessionCount: number;
    }
  >();

  for (const record of records) {
    const game = findTrackedGameByPackage(record.packageName);
    if (!game) {
      continue;
    }
    const existing = bySlug.get(game.slug);
    if (!existing) {
      bySlug.set(game.slug, {
        gameName: game.displayName,
        packageName: record.packageName,
        foregroundMs: record.foregroundMs,
        lastUsed: record.lastUsed,
        sessionCount: record.sessionCount,
      });
      continue;
    }
    existing.foregroundMs += record.foregroundMs;
    existing.sessionCount += record.sessionCount;
    if (record.lastUsed > existing.lastUsed) {
      existing.lastUsed = record.lastUsed;
      existing.packageName = record.packageName;
    }
  }

  return [...bySlug.entries()]
    .map(([gameSlug, row]) => ({
      gameSlug,
      gameName: row.gameName,
      packageName: row.packageName,
      foregroundMs: row.foregroundMs,
      formattedPlaytime: formatPlaytimeMs(row.foregroundMs),
      lastUsed: row.lastUsed,
      sessionCount: row.sessionCount,
      periodStart,
      periodEnd,
    }))
    .sort((a, b) => b.foregroundMs - a.foregroundMs);
}

export function normalizeGameUsage(
  result: GameUsageQueryResult,
): NormalizedGameUsage[] {
  return aggregateRecordsBySlug(
    result.records,
    result.periodStart,
    result.periodEnd,
  );
}

export function getTrackedPackageNamesForQuery(): string[] {
  return getVerifiedTrackedPackageIds();
}

export function getTrackedGameCount(): number {
  return ANDROID_TRACKED_GAMES.filter((g) =>
    g.packageIds.some((p) => p.verified),
  ).length;
}

export function computeUsageSharePercent(
  gameMs: number,
  totalMs: number,
): number {
  if (totalMs <= 0) {
    return 0;
  }
  return Math.round((gameMs / totalMs) * 100);
}

export type UsageSummary = {
  totalMs: number;
  formattedTotal: string;
  games: NormalizedGameUsage[];
  mostPlayed: NormalizedGameUsage | null;
  lastPlayed: NormalizedGameUsage | null;
};

export function summarizeUsage(games: NormalizedGameUsage[]): UsageSummary {
  const totalMs = games.reduce((sum, g) => sum + g.foregroundMs, 0);
  const mostPlayed = games.length > 0 ? games[0] : null;
  const lastPlayed =
    games.length > 0
      ? [...games].sort((a, b) => b.lastUsed - a.lastUsed)[0]
      : null;

  return {
    totalMs,
    formattedTotal: formatPlaytimeMs(totalMs),
    games,
    mostPlayed,
    lastPlayed,
  };
}
