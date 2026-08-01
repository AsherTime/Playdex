import { runNewsCollector } from "@/collectors/news-collector";
import { verifyCollectorCronRequest } from "@/lib/collector-auth";
import { collectorRunResponse } from "@/lib/collector-run-response";

export const runtime = "nodejs";
/** Hobby max is 60s; Pro allows up to 300s for large multi-source runs. */
export const maxDuration = 60;

async function handleCollectorRun(request: Request) {
  const unauthorized = verifyCollectorCronRequest(request);
  if (unauthorized) return unauthorized;

  const news = await runNewsCollector({ force: false });
  return collectorRunResponse(news);
}

/** Vercel Cron invokes GET on this path every 12 hours (see vercel.json). */
export async function GET(request: Request) {
  return handleCollectorRun(request);
}

export async function POST(request: Request) {
  return handleCollectorRun(request);
}
