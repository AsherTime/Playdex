import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { runNewsCollector } from "../src/collectors/news-collector";
import type { Database } from "../src/types/database";

const REMOVED_GAME_IDS = ["honkai-star-rail", "zenless-zone-zero"] as const;

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

async function main() {
  const env = loadEnv();
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("Removing Honkai: Star Rail and Zenless Zone Zero...");
  await supabase.from("news_items").delete().in("game_id", [...REMOVED_GAME_IDS]);
  await supabase.from("game_sources").delete().in("game_id", [...REMOVED_GAME_IDS]);
  await supabase.from("game_metrics_daily").delete().in("game_id", [...REMOVED_GAME_IDS]);
  await supabase.from("trend_scores").delete().in("game_id", [...REMOVED_GAME_IDS]);
  await supabase.from("games").delete().in("id", [...REMOVED_GAME_IDS]);

  console.log("Upserting Free Fire game and source...");
  const { error: gameError } = await supabase.from("games").upsert(
    {
      id: "free-fire",
      slug: "free-fire",
      title: "Free Fire",
      genre: "Battle Royale",
      platforms: ["Mobile"],
      release_date: "2017-12-04",
      cover_tone: "from-orange-500/35 to-amber-500/20",
      description:
        "Global mobile battle royale with frequent patch notes, collaborations, and esports events.",
      latest_updates: [
        "Garena official news registered",
        "Website collector ready",
        "Patch notes tracked",
      ],
      roadmap: ["Track official posts", "Add esports sources later", "Keep X/Twitter disabled"],
    },
    { onConflict: "id" },
  );
  if (gameError) throw new Error(gameError.message);

  const { error: sourceError } = await supabase.from("game_sources").upsert(
    {
      id: "free-fire-official-news",
      game_id: "free-fire",
      name: "Free Fire Official News",
      source_type: "website",
      url: "https://ff.garena.com/en/news/",
      external_ref: null,
      cadence: "60 min",
      cadence_minutes: 60,
      tags: ["official", "website"],
      enabled: true,
      status: "Pending",
    },
    { onConflict: "id" },
  );
  if (sourceError) throw new Error(sourceError.message);

  console.log("Running news collector...");
  const result = await runNewsCollector();
  console.log(result.message);
  result.errors?.forEach((error) => console.log(`- ${error}`));

  const { data: counts } = await supabase.from("news_items").select("game_id");
  const byGame = new Map<string, number>();
  for (const row of counts ?? []) {
    const gameId = row.game_id ?? "null";
    byGame.set(gameId, (byGame.get(gameId) ?? 0) + 1);
  }

  console.log("\nnews_items count by game:");
  for (const [gameId, count] of [...byGame.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${gameId}: ${count}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
