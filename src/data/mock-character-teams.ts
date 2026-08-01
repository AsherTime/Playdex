import type { CalcGameId } from "@/types/teams";
import { CALC_GAME_IDS } from "@/lib/team-games";
import { mockCharacters } from "@/data/mock-characters";

export interface MockTeamRankRow {
  rank: number;
  teamSlug: string;
  teamName: string;
  memberSlugs: string[];
  primaryMetric: string;
  rotation: string;
  totalDamage: string;
}

export interface MockDamageSource {
  id: string;
  name: string;
  role: string;
  element: string;
  share: number;
  portraitPath: string;
  weaponPath: string;
  weaponName: string;
  isExtraSource?: boolean;
}

export interface MockTeamBreakdown {
  teamSlug: string;
  teamName: string;
  memberSlugs: string[];
  primaryMetric: string;
  totalDamage: string;
  rotation: string;
  sources: MockDamageSource[];
}

const WUWA_PRIMARY_METRICS = ["2.60M", "2.45M", "2.30M", "2.15M"] as const;
const GENSHIN_PRIMARY_METRICS = ["142.6k", "128.4k", "115.2k"] as const;
const ROTATIONS = ["27.5s", "26.5s", "25.0s", "27.5s"] as const;

const WUWA_ASSET = {
  character: (file: string) => `/assets/characters/wuthering-waves/characters/${file}`,
  weapon: (file: string) => `/assets/characters/wuthering-waves/weapons/${file}`,
};

const GENSHIN_ASSET = {
  character: (slug: string) => `/assets/characters/genshin-impact/characters/${slug}.webp`,
  weapon: (slug: string) => `/assets/characters/genshin-impact/weapons/${slug}.webp`,
};

function formatTeamName(memberSlugs: string[]): string {
  return memberSlugs
    .map((slug) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(", ");
}

export function buildTeamSlug(memberSlugs: string[], extraSuffix?: string): string {
  const base = memberSlugs.join("-");
  return extraSuffix ? `${base}-${extraSuffix}` : base;
}

const WUWA_TEAM_BLUEPRINTS: Record<string, string[][]> = {
  changli: [
    ["changli", "galbrena", "phoebe"],
    ["changli", "augusta", "cartethyia"],
    ["changli", "zani", "phoebe"],
    ["aemeath", "denia", "chisa"],
  ],
};

const GENSHIN_TEAM_BLUEPRINTS: Record<string, string[][]> = {
  mavuika: [
    ["mavuika", "furina", "neuvillette", "columbina"],
    ["mavuika", "arlecchino", "furina", "sandrone"],
    ["mavuika", "neuvillette", "columbina", "furina"],
  ],
};

const WUWA_BREAKDOWNS: Record<string, Omit<MockTeamBreakdown, "teamSlug">> = {
  "changli-galbrena-phoebe": {
    teamName: "Changli, Galbrena, Phoebe",
    memberSlugs: ["changli", "galbrena", "phoebe"],
    primaryMetric: "2.60M",
    totalDamage: "2.60M",
    rotation: "27.5s",
    sources: [
      {
        id: "changli",
        name: "Changli",
        role: "Main DPS",
        element: "Fusion",
        share: 70,
        portraitPath: WUWA_ASSET.character("Changli.png"),
        weaponPath: WUWA_ASSET.weapon("Blazing Brilliance.png"),
        weaponName: "Blazing Brilliance",
      },
      {
        id: "galbrena",
        name: "Galbrena",
        role: "Sub-DPS",
        element: "Fusion",
        share: 18,
        portraitPath: WUWA_ASSET.character("Galbrena.png"),
        weaponPath: WUWA_ASSET.weapon("Verdant Summit.png"),
        weaponName: "Verdant Summit",
      },
      {
        id: "phoebe",
        name: "Phoebe",
        role: "Support",
        element: "Spectro",
        share: 12,
        portraitPath: WUWA_ASSET.character("Phoebe.png"),
        weaponPath: WUWA_ASSET.weapon("Woodland Aria.png"),
        weaponName: "Woodland Aria",
      },
    ],
  },
  "changli-augusta-cartethyia": {
    teamName: "Changli, Augusta, Cartethyia",
    memberSlugs: ["changli", "augusta", "cartethyia"],
    primaryMetric: "2.45M",
    totalDamage: "2.45M",
    rotation: "26.5s",
    sources: [
      {
        id: "changli",
        name: "Changli",
        role: "Main DPS",
        element: "Fusion",
        share: 68,
        portraitPath: WUWA_ASSET.character("Changli.png"),
        weaponPath: WUWA_ASSET.weapon("Blazing Brilliance.png"),
        weaponName: "Blazing Brilliance",
      },
      {
        id: "augusta",
        name: "Augusta",
        role: "Sub-DPS",
        element: "Havoc",
        share: 20,
        portraitPath: WUWA_ASSET.character("Augusta.png"),
        weaponPath: WUWA_ASSET.weapon("Blazing Justice.png"),
        weaponName: "Blazing Justice",
      },
      {
        id: "cartethyia",
        name: "Cartethyia",
        role: "Sub-DPS",
        element: "Aero",
        share: 12,
        portraitPath: WUWA_ASSET.character("Cartethyia.png"),
        weaponPath: WUWA_ASSET.weapon("Aureate Zenith.png"),
        weaponName: "Aureate Zenith",
      },
    ],
  },
  "changli-zani-phoebe": {
    teamName: "Changli, Zani, Phoebe",
    memberSlugs: ["changli", "zani", "phoebe"],
    primaryMetric: "2.30M",
    totalDamage: "2.30M",
    rotation: "25.0s",
    sources: [
      {
        id: "changli",
        name: "Changli",
        role: "Main DPS",
        element: "Fusion",
        share: 65,
        portraitPath: WUWA_ASSET.character("Changli.png"),
        weaponPath: WUWA_ASSET.weapon("Blazing Brilliance.png"),
        weaponName: "Blazing Brilliance",
      },
      {
        id: "zani",
        name: "Zani",
        role: "Sub-DPS",
        element: "Electro",
        share: 22,
        portraitPath: WUWA_ASSET.character("Zani.png"),
        weaponPath: WUWA_ASSET.weapon("Static Mist.png"),
        weaponName: "Static Mist",
      },
      {
        id: "phoebe",
        name: "Phoebe",
        role: "Support",
        element: "Spectro",
        share: 13,
        portraitPath: WUWA_ASSET.character("Phoebe.png"),
        weaponPath: WUWA_ASSET.weapon("Woodland Aria.png"),
        weaponName: "Woodland Aria",
      },
    ],
  },
  "aemeath-denia-chisa-fusion-burst": {
    teamName: "Aemeath, Denia, Chisa",
    memberSlugs: ["aemeath", "denia", "chisa"],
    primaryMetric: "2.15M",
    totalDamage: "2.15M",
    rotation: "27.5s",
    sources: [
      {
        id: "aemeath",
        name: "Aemeath",
        role: "Main DPS",
        element: "Fusion",
        share: 45,
        portraitPath: WUWA_ASSET.character("Aemeath.png"),
        weaponPath: WUWA_ASSET.weapon("Undying Flame.png"),
        weaponName: "Undying Flame",
      },
      {
        id: "denia",
        name: "Denia",
        role: "Sub-DPS",
        element: "Havoc",
        share: 20,
        portraitPath: WUWA_ASSET.character("Denia.png"),
        weaponPath: WUWA_ASSET.weapon("Bloodpact's Pledge.png"),
        weaponName: "Bloodpact's Pledge",
      },
      {
        id: "chisa",
        name: "Chisa",
        role: "Support",
        element: "Glacio",
        share: 18,
        portraitPath: WUWA_ASSET.character("Chisa.png"),
        weaponPath: WUWA_ASSET.weapon("Frostburn.png"),
        weaponName: "Frostburn",
      },
      {
        id: "fusion-burst",
        name: "Fusion Burst",
        role: "Extra Source",
        element: "Fusion",
        share: 17,
        portraitPath: WUWA_ASSET.weapon("Fusion Accretion.png"),
        weaponPath: WUWA_ASSET.weapon("Fusion Accretion.png"),
        weaponName: "Fusion Accretion",
        isExtraSource: true,
      },
    ],
  },
};

const GENSHIN_BREAKDOWNS: Record<string, Omit<MockTeamBreakdown, "teamSlug">> = {
  "mavuika-furina-neuvillette-columbina": {
    teamName: "Mavuika, Furina, Neuvillette, Columbina",
    memberSlugs: ["mavuika", "furina", "neuvillette", "columbina"],
    primaryMetric: "142.6k",
    totalDamage: "2.60M",
    rotation: "27.5s",
    sources: [
      {
        id: "mavuika",
        name: "Mavuika",
        role: "Main DPS",
        element: "Pyro",
        share: 42,
        portraitPath: GENSHIN_ASSET.character("mavuika"),
        weaponPath: GENSHIN_ASSET.weapon("a-thousand-blazing-suns"),
        weaponName: "A Thousand Blazing Suns",
      },
      {
        id: "neuvillette",
        name: "Neuvillette",
        role: "Main DPS",
        element: "Hydro",
        share: 28,
        portraitPath: GENSHIN_ASSET.character("neuvillette"),
        weaponPath: GENSHIN_ASSET.weapon("tome-of-the-eternal-flow"),
        weaponName: "Tome of the Eternal Flow",
      },
      {
        id: "furina",
        name: "Furina",
        role: "Support",
        element: "Hydro",
        share: 18,
        portraitPath: GENSHIN_ASSET.character("furina"),
        weaponPath: GENSHIN_ASSET.weapon("splendor-of-tranquil-waters"),
        weaponName: "Splendor of Tranquil Waters",
      },
      {
        id: "columbina",
        name: "Columbina",
        role: "Sub-DPS",
        element: "Cryo",
        share: 12,
        portraitPath: GENSHIN_ASSET.character("columbina"),
        weaponPath: GENSHIN_ASSET.weapon("symphonist-of-scents"),
        weaponName: "Symphonist of Scents",
      },
    ],
  },
};

function getTeamSlugForBlueprint(
  focusSlug: string,
  memberSlugs: string[],
  index: number,
): string {
  if (focusSlug === "changli" && index === 3) {
    return "aemeath-denia-chisa-fusion-burst";
  }
  return buildTeamSlug(memberSlugs);
}

function buildWuWaRows(focusSlug: string): MockTeamRankRow[] {
  const blueprints =
    WUWA_TEAM_BLUEPRINTS[focusSlug] ??
    [
      [focusSlug, "galbrena", "phoebe"],
      [focusSlug, "augusta", "cartethyia"],
      [focusSlug, "zani", "phoebe"],
    ];

  return blueprints.map((memberSlugs, index) => ({
    rank: index + 1,
    teamSlug: getTeamSlugForBlueprint(focusSlug, memberSlugs, index),
    teamName: formatTeamName(memberSlugs),
    memberSlugs,
    primaryMetric: WUWA_PRIMARY_METRICS[index] ?? "2.30M",
    rotation: ROTATIONS[index] ?? "25.0s",
    totalDamage: WUWA_PRIMARY_METRICS[index] ?? "2.30M",
  }));
}

function buildGenshinRows(focusSlug: string): MockTeamRankRow[] {
  const blueprints =
    GENSHIN_TEAM_BLUEPRINTS[focusSlug] ??
    [
      [focusSlug, "furina", "neuvillette", "columbina"],
      [focusSlug, "arlecchino", "furina", "sandrone"],
      [focusSlug, "neuvillette", "columbina", "furina"],
    ];

  const totalDamageValues = ["2.60M", "2.45M", "2.30M"];

  return blueprints.map((memberSlugs, index) => ({
    rank: index + 1,
    teamSlug: buildTeamSlug(memberSlugs),
    teamName: formatTeamName(memberSlugs),
    memberSlugs,
    primaryMetric: GENSHIN_PRIMARY_METRICS[index] ?? "115.2k",
    rotation: ROTATIONS[index] ?? "25.0s",
    totalDamage: totalDamageValues[index] ?? "2.30M",
  }));
}

export function getMockTeamRankings(
  gameId: CalcGameId,
  characterSlug: string,
): MockTeamRankRow[] {
  return gameId === "wuthering-waves"
    ? buildWuWaRows(characterSlug)
    : buildGenshinRows(characterSlug);
}

export function getPrimaryMetricLabel(gameId: CalcGameId): string {
  return gameId === "wuthering-waves" ? "Total DPR" : "Avg DPS";
}

export function getMockTeamBreakdown(
  gameId: CalcGameId,
  teamSlug: string,
): MockTeamBreakdown | undefined {
  const store = gameId === "wuthering-waves" ? WUWA_BREAKDOWNS : GENSHIN_BREAKDOWNS;
  const entry = store[teamSlug];
  if (!entry) return undefined;
  return { teamSlug, ...entry };
}

export function getTeamBreakdownHref(
  gameId: CalcGameId,
  characterSlug: string,
  teamSlug: string,
): string {
  return `/games/${gameId}/characters/${characterSlug}/teams/${teamSlug}`;
}

export function getAllMockTeamParams() {
  const params: Array<{ slug: CalcGameId; characterSlug: string; teamSlug: string }> = [];

  for (const gameId of CALC_GAME_IDS) {
    for (const character of mockCharacters.filter((entry) => entry.gameId === gameId)) {
      for (const row of getMockTeamRankings(gameId, character.slug)) {
        if (getMockTeamBreakdown(gameId, row.teamSlug)) {
          params.push({
            slug: gameId,
            characterSlug: character.slug,
            teamSlug: row.teamSlug,
          });
        }
      }
    }
  }

  return params;
}
