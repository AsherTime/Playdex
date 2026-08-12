import { absoluteProfileUrl } from "@/lib/username";

export async function shareProfileUrl(username: string, displayName: string) {
  const url = absoluteProfileUrl(username);
  const text = `Check out my Gamedex profile:\n${url}`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `${displayName} on Gamedex`,
        text: `Check out my Gamedex profile`,
        url,
      });
      return { method: "share" as const };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { method: "cancelled" as const };
      }
    }
  }

  await navigator.clipboard.writeText(text);
  return { method: "clipboard" as const };
}

export async function shareGamingSummary(payload: {
  username: string;
  displayName: string;
  weekTotalFormatted: string;
  gamesPlayed: number;
  topGames: Array<{ name: string; time: string }>;
  focusLine?: string;
}) {
  const lines = [
    "Gamedex",
    "",
    `${payload.displayName}'s Gaming Week`,
    "",
    `${payload.weekTotalFormatted} played`,
    `${payload.gamesPlayed} game${payload.gamesPlayed === 1 ? "" : "s"}`,
    "",
    ...payload.topGames.map(
      (game, index) => `#${index + 1} ${game.name} — ${game.time}`,
    ),
  ];

  if (payload.focusLine) {
    lines.push("", "Current focus:", payload.focusLine);
  }

  lines.push("", `@${payload.username}`);

  const text = lines.join("\n");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: `${payload.displayName}'s Gaming Week`, text });
      return { method: "share" as const };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { method: "cancelled" as const };
      }
    }
  }

  await navigator.clipboard.writeText(text);
  return { method: "clipboard" as const };
}

export function getShareBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
