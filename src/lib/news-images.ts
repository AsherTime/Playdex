const GAME_NEWS_FALLBACKS: Record<string, string> = {
  "genshin-impact": "/game-fallbacks/genshin-impact.svg",
  "wuthering-waves": "/game-fallbacks/wuthering-waves.svg",
  valorant: "/game-fallbacks/valorant.svg",
  "league-of-legends": "/game-fallbacks/league-of-legends.svg",
  "free-fire": "/game-fallbacks/free-fire.svg",
};

const DEFAULT_FALLBACK = "/game-fallbacks/default.svg";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hasFeedThumbnail(imageUrl: string | null | undefined) {
  return Boolean(imageUrl?.trim() && isHttpUrl(imageUrl.trim()));
}

export function getGameNewsFallback(gameId?: string | null) {
  if (!gameId) return DEFAULT_FALLBACK;
  return GAME_NEWS_FALLBACKS[gameId] ?? DEFAULT_FALLBACK;
}

export function resolveNewsImageUrl(imageUrl: string | null | undefined, gameId?: string | null) {
  if (imageUrl && isHttpUrl(imageUrl)) {
    return imageUrl;
  }

  return getGameNewsFallback(gameId);
}
