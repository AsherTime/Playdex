"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ANDROID_TRACKED_GAMES, getVerifiedTrackedPackageIds } from "@/data/android-tracked-games";
import { isAndroidApp } from "@/lib/capacitor/platform";
import { formatPlaytimeMs } from "@/lib/game-usage/format";
import {
  checkUsageAccess,
  readDeviceTrackerCache,
  readDeviceTrackerOptIn,
} from "@/lib/game-usage/service";

export function DeviceTrackerDebugPanel() {
  const searchParams = useSearchParams();
  const isAndroid = useSyncExternalStore(
    () => () => {},
    () => isAndroidApp(),
    () => false,
  );
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const showDebug =
    process.env.NODE_ENV === "development" || searchParams.get("debug") === "tracker";

  useEffect(() => {
    if (!showDebug || !isAndroid) return;
    void checkUsageAccess().then(setHasAccess);
  }, [showDebug, isAndroid]);

  if (!showDebug || !isAndroid) {
    return null;
  }

  const optIn = readDeviceTrackerOptIn();
  const cache = readDeviceTrackerCache();

  return (
    <details className="rounded-xl border border-dashed border-amber-400/30 bg-amber-500/5 p-4 text-xs text-amber-100">
      <summary className="cursor-pointer font-medium">Tracker debug (dev only)</summary>
      <div className="mt-3 space-y-2 font-mono">
        <p>Opt-in: {String(optIn)}</p>
        <p>Usage access granted: {hasAccess == null ? "…" : String(hasAccess)}</p>
        <p>Verified packages: {getVerifiedTrackedPackageIds().length}</p>
        <p>Supported games: {ANDROID_TRACKED_GAMES.length}</p>
        <p>Last refresh: {cache?.fetchedAt ? new Date(cache.fetchedAt).toLocaleString() : "never"}</p>
        <p>Today matched games: {cache?.today.games.length ?? 0}</p>
        <p>Week matched games: {cache?.week.games.length ?? 0}</p>
        <p>Today total: {cache ? formatPlaytimeMs(cache.today.totalMs) : "—"}</p>
        <p>Week total: {cache ? formatPlaytimeMs(cache.week.totalMs) : "—"}</p>
        <ul className="space-y-1">
          {cache?.week.games.map((game) => (
            <li key={game.gameSlug}>
              {game.gameName} · {game.formattedPlaytime} · {game.packageName}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
