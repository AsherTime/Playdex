"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { getGameDisplayIcon } from "@/data/android-tracked-games";
import { isAndroidApp } from "@/lib/capacitor/platform";
import { formatPlaytimeSeconds } from "@/lib/game-usage/format";
import {
  readDeviceTrackerCache,
  readDeviceTrackerOptIn,
  refreshDeviceTrackerData,
  checkUsageAccess,
  writeDeviceTrackerOptIn,
} from "@/lib/game-usage/service";
import { syncTodayUsageToSupabase } from "@/lib/game-usage/sync";
import type { GamingDashboardStats } from "@/lib/gaming-stats";
import { profilePath } from "@/lib/username";
import type { ServerProfile } from "@/lib/auth-server-helpers";

type DashboardView = {
  todayTotalSeconds: number;
  weekTotalSeconds: number;
  gamesPlayedThisWeek: number;
  mostPlayedName: string | null;
  weekGames: Array<{
    gameSlug: string;
    gameName: string;
    totalPlaytimeSeconds: number;
    formattedPlaytime: string;
    sharePercent: number;
  }>;
  source: "device" | "synced" | "none";
};

function mergeStats(
  device: DashboardView | null,
  synced: GamingDashboardStats | null,
): DashboardView {
  const pick = device?.weekGames.length ? device : synced
    ? {
        todayTotalSeconds: synced.todayTotalSeconds,
        weekTotalSeconds: synced.weekTotalSeconds,
        gamesPlayedThisWeek: synced.gamesPlayedThisWeek,
        mostPlayedName: synced.mostPlayedGame?.gameName ?? null,
        weekGames: synced.weekGames.map((g) => ({
          gameSlug: g.gameSlug,
          gameName: g.gameName,
          totalPlaytimeSeconds: g.totalPlaytimeSeconds,
          formattedPlaytime: g.formattedPlaytime,
          sharePercent: g.sharePercent,
        })),
        source: "synced" as const,
      }
    : null;

  return (
    pick ?? {
      todayTotalSeconds: 0,
      weekTotalSeconds: 0,
      gamesPlayedThisWeek: 0,
      mostPlayedName: null,
      weekGames: [],
      source: "none" as const,
    }
  );
}

function deviceCacheToView(
  cache: NonNullable<ReturnType<typeof readDeviceTrackerCache>>,
): DashboardView {
  return {
    todayTotalSeconds: Math.round(cache.today.totalMs / 1000),
    weekTotalSeconds: Math.round(cache.week.totalMs / 1000),
    gamesPlayedThisWeek: cache.week.games.length,
    mostPlayedName: cache.week.mostPlayed?.gameName ?? null,
    weekGames: cache.week.games.map((game) => ({
      gameSlug: game.gameSlug,
      gameName: game.gameName,
      totalPlaytimeSeconds: Math.round(game.foregroundMs / 1000),
      formattedPlaytime: game.formattedPlaytime,
      sharePercent: cache.week.totalMs
        ? Math.round((game.foregroundMs / cache.week.totalMs) * 100)
        : 0,
    })),
    source: "device",
  };
}

function GameBar({
  game,
}: {
  game: DashboardView["weekGames"][number];
}) {
  const icon = getGameDisplayIcon(game.gameSlug) ?? "/game-fallbacks/default.svg";
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/5">
          <Image src={icon} alt="" width={36} height={36} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-white">{game.gameName}</p>
            <p className="shrink-0 text-sm font-semibold text-indigo-100">
              {game.formattedPlaytime}
            </p>
          </div>
          <p className="text-[11px] text-zinc-500">this week</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              style={{ width: `${Math.max(game.sharePercent, 4)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GamingDashboard({
  profile,
  syncedStats,
  userId,
  isLoggedIn,
}: {
  profile: ServerProfile | null;
  syncedStats: GamingDashboardStats | null;
  userId: string | null;
  isLoggedIn: boolean;
}) {
  const isAndroid = useSyncExternalStore(
    () => () => {},
    () => isAndroidApp(),
    () => false,
  );
  const [trackerEnabled, setTrackerEnabled] = useState(() => readDeviceTrackerOptIn());
  const [deviceView, setDeviceView] = useState<DashboardView | null>(() => {
    const cache = readDeviceTrackerCache();
    return cache ? deviceCacheToView(cache) : null;
  });
  const [loading, setLoading] = useState(false);

  const refreshDevice = useCallback(async () => {
    if (!isAndroid || !trackerEnabled) return;
    const granted = await checkUsageAccess();
    if (!granted) return;
    setLoading(true);
    try {
      const cache = await refreshDeviceTrackerData();
      setDeviceView(deviceCacheToView(cache));
      if (userId) {
        await syncTodayUsageToSupabase(userId, cache.today.games);
      }
    } finally {
      setLoading(false);
    }
  }, [isAndroid, trackerEnabled, userId]);

  const view = useMemo(
    () => mergeStats(deviceView, syncedStats),
    [deviceView, syncedStats],
  );

  const displayName = profile?.name?.trim() || profile?.username || "Gamer";
  const hasActivity = view.weekTotalSeconds > 0 || view.weekGames.length > 0;

  if (!isLoggedIn) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.18),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(34,211,238,0.12),transparent_35%)]" />
        <div className="relative space-y-4 p-6 sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
            Gamedex
          </p>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your gaming identity, history, and improvement — in one place.
          </h1>
          <p className="max-w-xl text-sm leading-7 text-zinc-400">
            Track playtime on Android, build your gaming profile, and share it like a social
            profile when you&apos;re ready.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-300"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (isAndroid && !trackerEnabled) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.2),transparent_42%)]" />
        <div className="relative space-y-4 p-6 sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-300/80">
            Your Gaming Activity
          </p>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Track your gaming</h1>
          <p className="max-w-xl text-sm leading-7 text-zinc-400">
            See what you play, how long you play, and build your gaming history automatically on
            this device.
          </p>
          <button
            type="button"
            onClick={() => {
              writeDeviceTrackerOptIn(true);
              setTrackerEnabled(true);
            }}
            className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-5 py-2.5 text-sm font-medium text-cyan-50"
          >
            Enable tracking
          </button>
        </div>
      </section>
    );
  }

  if (!isAndroid && !hasActivity) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="relative space-y-4 p-6 sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
            Your Gaming Activity
          </p>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Build your gaming history
          </h1>
          <p className="max-w-xl text-sm leading-7 text-zinc-400">
            Install Gamedex on Android to automatically build your gaming history. Synced summaries
            will appear here once you refresh from the app.
          </p>
          {profile?.username ? (
            <Link
              href={profilePath(profile.username)}
              className="inline-flex rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-50"
            >
              View your profile
            </Link>
          ) : (
            <Link
              href="/profile"
              className="inline-flex rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-50"
            >
              Set up your profile
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(99,102,241,0.16),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(34,211,238,0.12),transparent_34%)]" />
      <div className="relative space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
              Gamedex
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
              {displayName}&apos;s Gaming Activity
            </h1>
          </div>
          <div className="flex gap-2">
            {isAndroid && trackerEnabled ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void refreshDevice()}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-50"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            ) : null}
            {profile?.username ? (
              <Link
                href={profilePath(profile.username)}
                className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-50"
              >
                View profile
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Today", value: formatPlaytimeSeconds(view.todayTotalSeconds) },
            { label: "This Week", value: formatPlaytimeSeconds(view.weekTotalSeconds) },
            { label: "Games Played", value: String(view.gamesPlayedThisWeek) },
            { label: "Most Played", value: view.mostPlayedName ?? "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {view.weekGames.length > 0 ? (
          <div className="space-y-2">
            {view.weekGames.slice(0, 5).map((game) => (
              <GameBar key={game.gameSlug} game={game} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-500">
            No supported game activity yet. Play a tracked game, then refresh.
          </p>
        )}
      </div>
    </section>
  );
}
