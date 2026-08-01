import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

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
  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase.from("news_items").select("game_id, source_name, source_type");
  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const gameId = row.game_id ?? "null";
    counts.set(gameId, (counts.get(gameId) ?? 0) + 1);
  }

  console.log("news_items count by game:");
  for (const [gameId, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${gameId}: ${count}`);
  }
  console.log(`  TOTAL: ${data?.length ?? 0}`);

  const { data: sources } = await supabase
    .from("game_sources")
    .select("id, name, game_id, status, last_error, enabled")
    .in("game_id", ["valorant", "league-of-legends"]);

  console.log("\nValorant/League sources:");
  for (const source of sources ?? []) {
    console.log(
      `  ${source.id} [${source.status}] enabled=${source.enabled}${source.last_error ? ` err=${source.last_error}` : ""}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
