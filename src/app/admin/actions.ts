"use server";

import { runNewsCollector } from "@/collectors/news-collector";
import { backfillMissingNewsImages } from "@/lib/backfill-news-images";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";

export async function runNewsCollectorAction() {
  return runNewsCollector({ force: true });
}

export async function backfillImagesAction() {
  return backfillMissingNewsImages(createServiceSupabaseClient());
}
