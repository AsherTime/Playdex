import fs from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runNewsCollector } from "../src/collectors/news-collector";
import { GACHA_GAME_IDS } from "../src/lib/gacha-games";
import type { Database } from "../src/types/database";

type SourceSeed = {
  id: string;
  game_id: string;
  name: string;
  url: string;
};

const GAME8_SOURCES: SourceSeed[] = [
  { id: "genshin-impact-game8-news", game_id: "genshin-impact", name: "Game8 Latest News", url: "https://game8.co/games/Genshin-Impact/archives/296701" },
  { id: "genshin-impact-game8-banners", game_id: "genshin-impact", name: "Game8 Banner Schedule", url: "https://game8.co/games/Genshin-Impact/archives/305012" },
  { id: "genshin-impact-game8-v66", game_id: "genshin-impact", name: "Game8 Version 6.6", url: "https://game8.co/games/Genshin-Impact/archives/594202" },
  { id: "genshin-impact-game8-v67", game_id: "genshin-impact", name: "Game8 Version 6.7", url: "https://game8.co/games/Genshin-Impact/archives/602045" },
  { id: "wuthering-waves-game8-news", game_id: "wuthering-waves", name: "Game8 Latest News", url: "https://game8.co/games/Wuthering-Waves/archives/452488" },
  { id: "wuthering-waves-game8-banners", game_id: "wuthering-waves", name: "Game8 Convene Banners", url: "https://game8.co/games/Wuthering-Waves/archives/453303" },
  { id: "wuthering-waves-game8-v35", game_id: "wuthering-waves", name: "Game8 Version 3.5", url: "https://game8.co/games/Wuthering-Waves/archives/605253" },
  { id: "wuthering-waves-game8-v34", game_id: "wuthering-waves", name: "Game8 Version 3.4", url: "https://game8.co/games/Wuthering-Waves/archives/599097" },
];

const DISABLED_RSS_SOURCES = [
  "genshin-impact-genshin-feed",
  "genshin-impact-hoyolab-rss",
];

function loadEnv() {
  const envPath = new URL("../.env.local", import.meta.url);
  const contents = fs.readFileSync(envPath, "utf8");

  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

async function upsertGame8Sources(supabase: SupabaseClient<Database>) {
  for (const source of GAME8_SOURCES) {
    const payload = {
      id: source.id,
      game_id: source.game_id,
      name: source.name,
      source_type: "trusted_site" as const,
      url: source.url,
      external_ref: "game8",
      cadence: "60 min",
      cadence_minutes: 60,
      tags: ["game8", "primary"],
      enabled: true,
      status: "Pending",
    };

    let { error } = await supabase.from("game_sources").upsert(payload, { onConflict: "id" });

    if (error?.message.includes("game_sources_type_check")) {
      ({ error } = await supabase.from("game_sources").upsert(
        { ...payload, source_type: "website" },
        { onConflict: "id" },
      ));
    }

    if (error) {
      throw new Error(`Failed to upsert ${source.id}: ${error.message}`);
    }
  }
}

async function disableBackupRss(supabase: SupabaseClient<Database>) {
  const { error } = await supabase
    .from("game_sources")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .in("id", DISABLED_RSS_SOURCES);

  if (error) {
    throw new Error(error.message);
  }
}

async function clearGachaNews(supabase: SupabaseClient<Database>) {
  const { error } = await supabase.from("news_items").delete().in("game_id", [...GACHA_GAME_IDS]);
  if (error) {
    throw new Error(error.message);
  }
}

async function printReport(supabase: SupabaseClient<Database>) {
  const { data: items, error } = await supabase
    .from("news_items")
    .select("id, game_id, source_type, source_name, image_url, url")
    .in("game_id", [...GACHA_GAME_IDS]);

  if (error) {
    throw new Error(error.message);
  }

  const perGame = new Map<string, { total: number; realImage: number; fallback: number; game8: number }>();
  for (const gameId of GACHA_GAME_IDS) {
    perGame.set(gameId, { total: 0, realImage: 0, fallback: 0, game8: 0 });
  }

  for (const item of items ?? []) {
    if (!item.game_id) continue;
    const stats = perGame.get(item.game_id);
    if (!stats) continue;
    stats.total += 1;
    const hasRealImage = Boolean(item.image_url?.startsWith("http"));
    if (hasRealImage) stats.realImage += 1;
    else stats.fallback += 1;
    if (item.source_type === "trusted_site" || item.source_name === "Game8") stats.game8 += 1;
  }

  console.log("\nCollection report:");
  for (const [gameId, stats] of perGame) {
    console.log(
      `${gameId}: ${stats.total} items (${stats.game8} Game8, ${stats.realImage} real image_url, ${stats.fallback} fallback/missing)`,
    );
  }

  const { data: sources } = await supabase
    .from("game_sources")
    .select("id, name, status, last_error")
    .or("external_ref.eq.game8,source_type.eq.trusted_site");

  console.log("\nGame8 source status:");
  for (const source of sources ?? []) {
    console.log(`- ${source.name}: ${source.status}${source.last_error ? ` (${source.last_error})` : ""}`);
  }
}

async function main() {
  const env = loadEnv();
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("Upserting Game8 sources...");
  await upsertGame8Sources(supabase);

  console.log("Disabling HoYo/Genshin Feed RSS backups for gacha games...");
  await disableBackupRss(supabase);

  console.log("Clearing existing gacha news_items...");
  await clearGachaNews(supabase);

  console.log("Running news collector...");
  const result = await runNewsCollector();
  console.log(result.message);
  if (result.errors?.length) {
    result.errors.forEach((error) => console.log(`- ${error}`));
  }

  await printReport(supabase);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
