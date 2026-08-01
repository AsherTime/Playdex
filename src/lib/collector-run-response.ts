import type { CollectorRunResult } from "@/types/gamedex";

export function collectorRunResponse(news: CollectorRunResult) {
  return Response.json({
    collector: "run",
    status: news.status,
    collectedAt: news.collectedAt,
    processedRecords: news.processedRecords,
    message: `Collector run finished: ${news.message}`,
    errors: news.errors ?? [],
    results: { news },
  });
}
