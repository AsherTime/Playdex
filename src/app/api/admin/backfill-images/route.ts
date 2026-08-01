import { verifyCollectorCronRequest } from "@/lib/collector-auth";
import { backfillMissingNewsImages } from "@/lib/backfill-news-images";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = verifyCollectorCronRequest(request);
  if (unauthorized) return unauthorized;

  const result = await backfillMissingNewsImages(createServiceSupabaseClient());
  return Response.json(result);
}
