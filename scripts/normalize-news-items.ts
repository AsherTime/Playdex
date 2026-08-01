import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { normalizeNewsSummary, normalizeNewsTitle } from "../src/utils/news-normalize";

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
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: rows, error } = await supabase
    .from("news_items")
    .select("id, title, summary")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  let updated = 0;

  for (const row of rows ?? []) {
    const title = normalizeNewsTitle(row.title);
    const summary = normalizeNewsSummary(row.summary, title, row.title);

    if (title === row.title && summary === row.summary) continue;

    const { error: updateError } = await supabase
      .from("news_items")
      .update({ title, summary })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    updated += 1;
  }

  console.log(`Normalized ${updated} of ${rows?.length ?? 0} news items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
