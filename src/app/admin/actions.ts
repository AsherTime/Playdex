"use server";

import { runNewsCollector } from "@/collectors/news-collector";
import { backfillMissingNewsImages } from "@/lib/backfill-news-images";
import { requireAdmin } from "@/lib/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";

export async function runNewsCollectorAction() {
  await requireAdmin();
  return runNewsCollector({ force: true });
}

export async function backfillImagesAction() {
  await requireAdmin();
  return backfillMissingNewsImages(createServiceSupabaseClient());
}
