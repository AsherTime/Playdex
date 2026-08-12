import GameUsage from "@/lib/game-usage/plugin";
import {
  getTrackedPackageNamesForQuery,
  normalizeGameUsage,
  summarizeUsage,
  type UsageSummary,
} from "@/lib/game-usage/normalize";
import {
  startOfLocalDay,
  startOfLocalDayDaysAgo,
} from "@/lib/game-usage/format";

export const DEVICE_TRACKER_OPT_IN_KEY = "gamedex-device-tracker-opt-in";
export const DEVICE_TRACKER_DECLINED_KEY = "gamedex-device-tracker-declined";
export const DEVICE_TRACKER_CACHE_KEY = "gamedex-device-tracker-cache";

export type DeviceTrackerCache = {
  today: UsageSummary;
  week: UsageSummary;
  fetchedAt: number;
};

function emptySummary(): UsageSummary {
  return summarizeUsage([]);
}

export function readDeviceTrackerOptIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(DEVICE_TRACKER_OPT_IN_KEY) === "true";
}

export function writeDeviceTrackerOptIn(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEVICE_TRACKER_OPT_IN_KEY, enabled ? "true" : "false");
  if (enabled) {
    window.localStorage.removeItem(DEVICE_TRACKER_DECLINED_KEY);
  }
}

export function readDeviceTrackerDeclined(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(DEVICE_TRACKER_DECLINED_KEY) === "true";
}

export function writeDeviceTrackerDeclined(declined: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEVICE_TRACKER_DECLINED_KEY, declined ? "true" : "false");
}

export function readDeviceTrackerCache(): DeviceTrackerCache | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(DEVICE_TRACKER_CACHE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DeviceTrackerCache;
  } catch {
    return null;
  }
}

export function writeDeviceTrackerCache(cache: DeviceTrackerCache): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEVICE_TRACKER_CACHE_KEY, JSON.stringify(cache));
}

export async function checkUsageAccess(): Promise<boolean> {
  const { granted } = await GameUsage.hasUsageAccess();
  return granted;
}

export async function openUsageAccessSettings(): Promise<void> {
  await GameUsage.openUsageAccessSettings();
}

async function queryPeriod(startTime: number, endTime: number): Promise<UsageSummary> {
  const packageNames = getTrackedPackageNamesForQuery();
  if (packageNames.length === 0) {
    return emptySummary();
  }
  const result = await GameUsage.getGameUsage({
    startTime,
    endTime,
    packageNames,
  });
  return summarizeUsage(normalizeGameUsage(result));
}

export async function fetchTodayUsage(): Promise<UsageSummary> {
  const now = Date.now();
  return queryPeriod(startOfLocalDay(), now);
}

export async function fetchWeeklyUsage(): Promise<UsageSummary> {
  const now = Date.now();
  return queryPeriod(startOfLocalDayDaysAgo(6), now);
}

export async function refreshDeviceTrackerData(): Promise<DeviceTrackerCache> {
  const [today, week] = await Promise.all([
    fetchTodayUsage(),
    fetchWeeklyUsage(),
  ]);
  const cache: DeviceTrackerCache = {
    today,
    week,
    fetchedAt: Date.now(),
  };
  writeDeviceTrackerCache(cache);
  return cache;
}
