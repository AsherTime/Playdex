/**
 * Android package IDs for games Gamedex can track via UsageStatsManager.
 *
 * Only add package IDs you have verified on a real device or from the official Play Store listing.
 * Unverified entries stay in the registry with `verified: false` and are excluded from tracking queries.
 */
export type AndroidPackageRef = {
  /** Android applicationId / package name */
  id: string;
  /** True when confirmed on Play Store or a physical device */
  verified: boolean;
  /** Region / variant notes (e.g. global vs CN) */
  note?: string;
};

export type AndroidTrackedGame = {
  /** Gamedex internal slug (matches followable-games where applicable) */
  slug: string;
  displayName: string;
  packageIds: AndroidPackageRef[];
  /** Public asset path for UI (optional) */
  iconPath?: string;
};

export const ANDROID_TRACKED_GAMES: AndroidTrackedGame[] = [
  {
    slug: "genshin-impact",
    displayName: "Genshin Impact",
    iconPath: "/game-fallbacks/genshin-impact.svg",
    packageIds: [
      {
        id: "com.miHoYo.GenshinImpact",
        verified: true,
        note: "Global (HoYoverse) Play Store build",
      },
    ],
  },
  {
    slug: "wuthering-waves",
    displayName: "Wuthering Waves",
    iconPath: "/game-fallbacks/wuthering-waves.svg",
    packageIds: [
      {
        id: "com.kurogame.wutheringwaves.global",
        verified: true,
        note: "Global Play Store build",
      },
    ],
  },
  {
    slug: "honkai-star-rail",
    displayName: "Honkai: Star Rail",
    iconPath: "/game-fallbacks/default.svg",
    packageIds: [
      {
        id: "com.HoYoverse.hkrpgoversea",
        verified: true,
        note: "Global Play Store build",
      },
    ],
  },
  {
    slug: "zenless-zone-zero",
    displayName: "Zenless Zone Zero",
    iconPath: "/game-fallbacks/default.svg",
    packageIds: [
      {
        id: "com.HoYoverse.Nap",
        verified: true,
        note: "Global Play Store build",
      },
    ],
  },
  {
    slug: "free-fire",
    displayName: "Free Fire",
    iconPath: "/game-fallbacks/free-fire.svg",
    packageIds: [
      {
        id: "com.dts.freefireth",
        verified: true,
        note: "Common global variant; regional IDs may differ",
      },
      {
        id: "com.dts.freefiremax",
        verified: true,
        note: "Free Fire MAX",
      },
    ],
  },
  {
    slug: "valorant",
    displayName: "VALORANT Mobile",
    iconPath: "/game-fallbacks/valorant.svg",
    packageIds: [
      {
        id: "com.riotgames.valorant",
        verified: false,
        note: "Requires verification on your device / Play Store region",
      },
    ],
  },
  {
    slug: "league-of-legends",
    displayName: "League of Legends: Wild Rift",
    iconPath: "/game-fallbacks/league-of-legends.svg",
    packageIds: [
      {
        id: "com.riotgames.league.wildrift",
        verified: true,
        note: "Wild Rift (mobile); PC League has no Android package",
      },
    ],
  },
];

/** Verified package IDs only — passed to the native plugin. */
export function getVerifiedTrackedPackageIds(): string[] {
  const ids = new Set<string>();
  for (const game of ANDROID_TRACKED_GAMES) {
    for (const pkg of game.packageIds) {
      if (pkg.verified) {
        ids.add(pkg.id);
      }
    }
  }
  return [...ids];
}

export function findTrackedGameByPackage(
  packageName: string,
): AndroidTrackedGame | undefined {
  return ANDROID_TRACKED_GAMES.find((game) =>
    game.packageIds.some((pkg) => pkg.id === packageName),
  );
}

export function getGameDisplayIcon(slug: string): string | undefined {
  return ANDROID_TRACKED_GAMES.find((g) => g.slug === slug)?.iconPath;
}
