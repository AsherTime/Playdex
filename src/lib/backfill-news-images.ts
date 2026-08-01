import { fetchArticleImage } from "@/lib/news-image-extract";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BackfillImagesResult {
  processed: number;
  found: number;
  fallback: number;
  message: string;
  errors: string[];
}

const BACKFILL_DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function backfillMissingNewsImages(
  supabase: SupabaseClient<Database>,
): Promise<BackfillImagesResult> {
  const { data: rows, error } = await supabase
    .from("news_items")
    .select("id, url, image_url")
    .is("image_url", null)
    .not("url", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  let found = 0;
  let fallback = 0;
  const errors: string[] = [];

  for (const row of rows ?? []) {
    if (!row.url) {
      fallback += 1;
      continue;
    }

    try {
      const imageUrl = await fetchArticleImage(row.url);

      if (imageUrl) {
        const { error: updateError } = await supabase
          .from("news_items")
          .update({ image_url: imageUrl })
          .eq("id", row.id);

        if (updateError) {
          errors.push(`${row.id}: ${updateError.message}`);
          fallback += 1;
        } else {
          found += 1;
        }
      } else {
        fallback += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown fetch error";
      errors.push(`${row.id}: ${message}`);
      fallback += 1;
    }

    await sleep(BACKFILL_DELAY_MS);
  }

  const processed = rows?.length ?? 0;
  const message = `Backfill complete: ${found} image${found === 1 ? "" : "s"} found, ${fallback} using game fallback${fallback === 1 ? "" : "s"}.`;

  return {
    processed,
    found,
    fallback,
    message,
    errors,
  };
}
