export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "signup",
  "profile",
  "profiles",
  "settings",
  "games",
  "game",
  "news",
  "improve",
  "gamedex",
  "playdex",
  "u",
  "user",
  "users",
  "www",
  "app",
  "android",
  "help",
  "support",
  "about",
  "privacy",
  "terms",
  "callback",
  "reset-password",
  "forgot-password",
]);

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(input: string): string | null {
  const username = normalizeUsername(input);
  if (!username) {
    return "Username is required.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Username must be 3–24 characters: lowercase letters, numbers, and underscores only.";
  }
  if (RESERVED_USERNAMES.has(username)) {
    return "That username is reserved.";
  }
  return null;
}

export function profilePath(username: string): string {
  return `/u/${encodeURIComponent(normalizeUsername(username))}`;
}

export function absoluteProfileUrl(username: string, appUrl?: string): string {
  const base =
    appUrl?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${profilePath(username)}`;
}
