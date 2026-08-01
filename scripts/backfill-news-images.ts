import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { backfillMissingNewsImages } from "../src/lib/backfill-news-images";

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
  const result = await backfillMissingNewsImages(supabase);

  console.log(result.message);
  console.log(`Processed: ${result.processed}`);
  console.log(`Found: ${result.found}`);
  console.log(`Fallback: ${result.fallback}`);

  if (result.errors.length) {
    console.log("Errors:");
    result.errors.forEach((error) => console.log(`- ${error}`));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
