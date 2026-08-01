import { backfillMissingNewsImages } from "@/lib/backfill-news-images";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const result = await backfillMissingNewsImages(createServiceSupabaseClient());
  return Response.json(result);
}
