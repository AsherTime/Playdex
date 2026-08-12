"use client";

import { App as CapApp } from "@capacitor/app";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ANDROID_TRACKED_GAMES, getGameDisplayIcon } from "@/data/android-tracked-games";
import { isAndroidApp } from "@/lib/capacitor/platform";
import { formatRelativeLastPlayed } from "@/lib/game-usage/format";
import { computeUsageSharePercent } from "@/lib/game-usage/normalize";
import {
  checkUsageAccess,
  openUsageAccessSettings,
  readDeviceTrackerCache,
  readDeviceTrackerDeclined,
  readDeviceTrackerOptIn,
  refreshDeviceTrackerData,
  writeDeviceTrackerDeclined,
  writeDeviceTrackerOptIn,
  type DeviceTrackerCache,
} from "@/lib/game-usage/service";
import { syncTodayUsageToSupabase, fetchRecentSyncedUsage } from "@/lib/game-usage/sync";
import { formatPlaytimeSeconds } from "@/lib/game-usage/format";
import type { NormalizedGameUsage } from "@/lib/game-usage/types";

type Period = "today" | "week";

function GameUsageRow({
  game,
  totalMs,
}: {
  game: NormalizedGameUsage;
  totalMs: number;
}) {
  const icon = getGameDisplayIcon(game.gameSlug) ?? "/game-fallbacks/default.svg";
  const share = computeUsageSharePercent(game.foregroundMs, totalMs);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
        <Image src={icon} alt="" width={40} height={40} className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{game.gameName}</p>
        <p className="text-xs text-zinc-500">
          {share}% of gaming time
          {game.sessionCount > 0 ? ` · ${game.sessionCount} sessions` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-indigo-100">{game.formattedPlaytime}</p>
        <p className="text-[11px] text-zinc-500">{formatRelativeLastPlayed(game.lastUsed)}</p>
      </div>
    </li>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function WebOnlyNotice() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
        Device Game Activity
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">Android app only</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Voluntary device playtime tracking is available in the Gamedex Android app using Android&apos;s
        official Usage Access API. Install the app to see how much time you spend in supported games.
      </p>
    </section>
  );
}

export function DeviceGameActivity() {
  const { user } = useAuth();
  const isAndroid = useSyncExternalStore(
    () => () => {},
    () => isAndroidApp(),
    () => false,
  );
  const [optIn, setOptIn] = useState(() => readDeviceTrackerOptIn());
  const [declined, setDeclined] = useState(() => readDeviceTrackerDeclined());
  const [hasAccess, setHasAccess] = useState(false);
  const [period, setPeriod] = useState<Period>("today");
  const [cache, setCache] = useState<DeviceTrackerCache | null>(() => readDeviceTrackerCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [showEnableInfo, setShowEnableInfo] = useState(false);
  const [dailyTrend, setDailyTrend] = useState<Array<{ date: string; seconds: number }>>([]);
  const verifiedGameCount = useMemo(
    () => ANDROID_TRACKED_GAMES.filter((g) => g.packageIds.some((p) => p.verified)).length,
    [],
  );

  const activeSummary = period === "today" ? cache?.today : cache?.week;

  const refreshAccessAndData = useCallback(async () => {
    if (!isAndroid || !optIn) {
      return;
    }
    const granted = await checkUsageAccess();
    setHasAccess(granted);
    if (!granted) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const next = await refreshDeviceTrackerData();
      setCache(next);
      if (user?.id) {
        await syncTodayUsageToSupabase(user.id, next.today.games);
        setSyncMessage("Synced today's summary to your account.");
        const rows = await fetchRecentSyncedUsage(user.id, 7);
        const byDate = new Map<string, number>();
        for (const row of rows) {
          byDate.set(
            row.usage_date,
            (byDate.get(row.usage_date) ?? 0) + row.playtime_seconds,
          );
        }
        setDailyTrend(
          [...byDate.entries()]
            .map(([date, seconds]) => ({ date, seconds }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game usage");
    } finally {
      setLoading(false);
    }
  }, [isAndroid, optIn, user]);

  useEffect(() => {
    if (!isAndroid || !optIn) {
      return;
    }
    void (async () => {
      const granted = await checkUsageAccess();
      setHasAccess(granted);
      if (granted && !cache) {
        await refreshAccessAndData();
      }
    })();
  }, [isAndroid, optIn, cache, refreshAccessAndData]);

  useEffect(() => {
    if (!isAndroid || !optIn) {
      return;
    }
    const listener = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void (async () => {
          const granted = await checkUsageAccess();
          setHasAccess(granted);
          if (granted) {
            await refreshAccessAndData();
          }
        })();
      }
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [isAndroid, optIn, refreshAccessAndData]);

  if (!isAndroid) {
    return <WebOnlyNotice />;
  }

  const handleEnableTracking = () => {
    writeDeviceTrackerOptIn(true);
    setOptIn(true);
    setDeclined(false);
    setShowEnableInfo(true);
  };

  const handleDecline = () => {
    writeDeviceTrackerDeclined(true);
    writeDeviceTrackerOptIn(false);
    setDeclined(true);
    setOptIn(false);
    setShowEnableInfo(false);
  };

  const handleDisableTracking = () => {
    writeDeviceTrackerOptIn(false);
    setOptIn(false);
    setShowEnableInfo(false);
  };

  const handleOpenSettings = async () => {
    setShowEnableInfo(true);
    await openUsageAccessSettings();
  };

  if (!optIn) {
    if (declined) {
      return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
            Device Game Activity
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">Tracking is off</h2>
          <p className="mt-2 text-sm text-zinc-400">
            You chose not to enable device game tracking. You can turn it on anytime — Gamedex only
            reads usage for {verifiedGameCount} supported games you have installed.
          </p>
          <button
            type="button"
            onClick={handleEnableTracking}
            className="mt-4 rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-50"
          >
            Enable game tracking
          </button>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
          Device Game Activity
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Track playtime on this device</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Opt in to see how much time you spend in supported games installed on this phone. Gamedex
          uses Android&apos;s Usage Access API — not accessibility, screen recording, or VPN
          tracking. Only {verifiedGameCount} verified game package IDs are queried.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEnableTracking}
            className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-50"
          >
            Enable game tracking
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400"
          >
            Not now
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
            Device Game Activity
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">Supported games on this device</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Local-first summaries · {verifiedGameCount} supported titles
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !hasAccess}
            onClick={() => void refreshAccessAndData()}
            className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-50 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleDisableTracking}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400"
          >
            Turn off
          </button>
        </div>
      </div>

      {!hasAccess ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-4">
          <p className="text-sm font-medium text-amber-50">Usage Access required</p>
          {showEnableInfo ? (
            <p className="mt-2 text-sm text-amber-100/90">
              Gamedex needs Usage Access so Android can share foreground time for supported games
              only. Open Settings, find Gamedex, and enable &quot;Permit usage access&quot;. Return
              here and we&apos;ll check automatically.
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-100/90">
              Grant Usage Access once to read playtime for supported games installed on this device.
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleOpenSettings()}
            className="mt-3 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-sm font-medium text-amber-50"
          >
            Open Usage Access settings
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Today" value={cache?.today.formattedTotal ?? "—"} />
            <StatCard label="This week" value={cache?.week.formattedTotal ?? "—"} />
            <StatCard
              label="Most played"
              value={cache?.week.mostPlayed?.gameName ?? "—"}
              hint={cache?.week.mostPlayed?.formattedPlaytime}
            />
            <StatCard
              label="Last played"
              value={cache?.week.lastPlayed?.gameName ?? "—"}
              hint={
                cache?.week.lastPlayed
                  ? formatRelativeLastPlayed(cache.week.lastPlayed.lastUsed)
                  : undefined
              }
            />
          </div>

          <div className="flex gap-2">
            {(["today", "week"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  period === key
                    ? "border border-indigo-400/40 bg-indigo-500/15 text-indigo-50"
                    : "border border-white/10 text-zinc-400"
                }`}
              >
                {key === "today" ? "Today" : "This week"}
              </button>
            ))}
          </div>

          {dailyTrend.length >= 2 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Daily trend (synced)
              </p>
              <div className="mt-3 flex items-end gap-2">
                {dailyTrend.map((day) => {
                  const max = Math.max(...dailyTrend.map((d) => d.seconds), 1);
                  const height = Math.max(12, Math.round((day.seconds / max) * 72));
                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-indigo-500/40"
                        style={{ height }}
                        title={formatPlaytimeSeconds(day.seconds)}
                      />
                      <span className="text-[10px] text-zinc-600">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
                          weekday: "short",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeSummary && activeSummary.games.length > 0 ? (
            <ul className="space-y-2">
              {activeSummary.games.map((game) => (
                <GameUsageRow
                  key={`${period}-${game.gameSlug}`}
                  game={game}
                  totalMs={activeSummary.totalMs}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-zinc-500">
              No supported game playtime recorded for this period. Play a tracked game, then tap
              Refresh.
            </p>
          )}

          {cache?.fetchedAt ? (
            <p className="text-[11px] text-zinc-600">
              Last updated {new Date(cache.fetchedAt).toLocaleString()}
            </p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {syncMessage ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {syncMessage}
        </p>
      ) : null}
    </section>
  );
}
