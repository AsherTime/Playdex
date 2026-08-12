/** Local calendar date as YYYY-MM-DD (not UTC). */
export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Format milliseconds as human-readable playtime (e.g. "4h 22m", "45m", "< 1m"). */
export function formatPlaytimeMs(ms: number): string {
  if (ms <= 0) {
    return "0m";
  }
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) {
    return "< 1m";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatPlaytimeSeconds(seconds: number): string {
  return formatPlaytimeMs(seconds * 1000);
}

/** Start of local calendar day in epoch ms. */
export function startOfLocalDay(date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of local day N days ago (0 = today). */
export function startOfLocalDayDaysAgo(daysAgo: number): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return startOfLocalDay(d);
}

export function formatRelativeLastPlayed(timestampMs: number): string {
  if (!timestampMs || timestampMs <= 0) {
    return "Never";
  }
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  return new Date(timestampMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
