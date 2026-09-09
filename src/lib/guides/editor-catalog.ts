import "server-only";

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { GuideEditorCatalogs } from "@/lib/guides/revision-types";
import { requireGuideWriter } from "@/lib/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";
import type { Json } from "@/types/database";

const GAME_ID = "genshin-impact";

export type { GuideEditorCatalogs, GuideEditorCharacterOption } from "@/lib/guides/revision-types";

export async function getGuideEditorCatalogs(): Promise<GuideEditorCatalogs> {
  await requireGuideWriter();
  const supabase = createServiceSupabaseClient();

  const [charactersResult, buildsResult] = await Promise.all([
    supabase
      .from("game_characters")
      .select("id, slug, display_name")
      .eq("game_id", GAME_ID)
      .order("display_name", { ascending: true }),
    supabase
      .from("character_builds")
      .select("best_weapons, alternative_weapons, f2p_weapons, best_artifacts, alternative_artifacts"),
  ]);

  if (charactersResult.error) throw charactersResult.error;
  if (buildsResult.error) throw buildsResult.error;

  const weaponNames = new Set<string>();
  const artifactNames = new Set<string>();

  for (const build of buildsResult.data ?? []) {
    collectRankedNames(build.best_weapons, weaponNames);
    collectRankedNames(build.alternative_weapons, weaponNames);
    collectRankedNames(build.f2p_weapons, weaponNames);
    collectRankedNames(build.best_artifacts, artifactNames);
    collectRankedNames(build.alternative_artifacts, artifactNames);
  }

  for (const name of readAssetDisplayNames("weapons")) weaponNames.add(name);
  for (const name of readAssetDisplayNames("artifacts")) artifactNames.add(name);

  return {
    weapons: [...weaponNames].sort((a, b) => a.localeCompare(b)),
    artifacts: [...artifactNames].sort((a, b) => a.localeCompare(b)),
    characters: (charactersResult.data ?? []).map((character) => ({
      id: character.id,
      slug: character.slug,
      name: character.display_name,
    })),
  };
}

function collectRankedNames(value: Json, target: Set<string>) {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const name = (item as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) target.add(name.trim());
  }
}

function readAssetDisplayNames(kind: "weapons" | "artifacts") {
  const folder = join(process.cwd(), "public", "assets", "characters", GAME_ID, kind);
  if (!existsSync(folder)) return [] as string[];

  return readdirSync(folder)
    .filter((file) => /\.(webp|png|jpe?g)$/i.test(file) && !file.startsWith("."))
    .map((file) => titleFromSlug(file.replace(/\.(webp|png|jpe?g)$/i, "")))
    .filter(Boolean);
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
