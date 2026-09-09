import "server-only";

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

type AssetKind = "characters" | "weapons" | "artifacts";

export type ResolvedGuideAsset = {
  path: string | null;
  missing: boolean;
  checkedCandidates: string[];
};

const assetIndex = new Map<string, Map<string, string>>();

export function resolveCharacterIcon(
  gameSlug: string,
  characterSlug: string,
  characterName: string,
): ResolvedGuideAsset {
  const candidates = [
    characterSlug,
    slugify(characterName),
    ...travelerVariantCandidates(characterName),
  ];

  return resolveGuideAsset(gameSlug, "characters", unique(candidates));
}

export function resolveWeaponIcon(gameSlug: string, weaponName: string): ResolvedGuideAsset {
  return resolveGuideAsset(gameSlug, "weapons", [slugify(weaponName)]);
}

export function resolveArtifactIcon(gameSlug: string, artifactName: string): ResolvedGuideAsset {
  return resolveGuideAsset(gameSlug, "artifacts", [slugify(artifactName)]);
}

function resolveGuideAsset(
  gameSlug: string,
  kind: AssetKind,
  candidates: string[],
): ResolvedGuideAsset {
  const index = getAssetIndex(gameSlug, kind);
  const checkedCandidates = candidates.flatMap((candidate) => [
    `${candidate}.webp`,
    `${candidate}.png`,
    `${candidate}.jpg`,
    `${candidate}.jpeg`,
  ]);

  for (const candidate of checkedCandidates) {
    const match = index.get(candidate.toLowerCase());
    if (match) {
      return {
        path: `/assets/characters/${gameSlug}/${kind}/${match}`,
        missing: false,
        checkedCandidates,
      };
    }
  }

  return { path: null, missing: true, checkedCandidates };
}

function getAssetIndex(gameSlug: string, kind: AssetKind) {
  const cacheKey = `${gameSlug}:${kind}`;
  const cached = assetIndex.get(cacheKey);
  if (cached) return cached;

  const folder = join(process.cwd(), "public", "assets", "characters", gameSlug, kind);
  const index = new Map<string, string>();
  if (existsSync(folder)) {
    const files = readdirSync(folder);
    for (const file of files) {
      index.set(file.toLowerCase(), file);
    }

    if (kind === "characters") {
      const suffixBuckets = new Map<string, string[]>();
      for (const file of files) {
        const stem = file.replace(/\.(webp|png|jpe?g|svg)$/i, "").toLowerCase();
        const suffix = stem.split("-").at(-1);
        if (!suffix || suffix === stem) continue;

        const bucket = suffixBuckets.get(suffix) ?? [];
        bucket.push(file);
        suffixBuckets.set(suffix, bucket);
      }

      for (const [suffix, bucket] of suffixBuckets.entries()) {
        if (bucket.length !== 1) continue;
        const extension = bucket[0].match(/\.(webp|png|jpe?g|svg)$/i)?.[0] ?? ".webp";
        index.set(`${suffix}${extension}`.toLowerCase(), bucket[0]);
      }
    }
  }

  assetIndex.set(cacheKey, index);
  return index;
}

function travelerVariantCandidates(characterName: string) {
  const match = characterName.match(/^Traveler \(([^)]+)\)$/i);
  if (!match) return [];
  const element = slugify(match[1]);
  return [`${element}-traveler`, `traveler-${element}`];
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
