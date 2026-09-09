import { runNewsCollector } from "@/collectors/news-collector";
import { verifyCollectorCronRequest } from "@/lib/collector-auth";
import { collectorRunResponse } from "@/lib/collector-run-response";

export const runtime = "nodejs";
/** Hobby max is 60s; Pro allows up to 300s for large multi-source runs. */
export const maxDuration = 60;

async function handleCollectorRun(request: Request) {
  const unauthorized = verifyCollectorCronRequest(request);
  if (unauthorized) return unauthorized;

  const force = new URL(request.url).searchParams.get("force") === "1";
  const news = await runNewsCollector({ force });
  return collectorRunResponse(news);
}

/** Supabase Cron invokes this hourly; Vercel Cron is only a daily fallback. */
export async function GET(request: Request) {
  return handleCollectorRun(request);
}

export async function POST(request: Request) {
  return handleCollectorRun(request);
}
