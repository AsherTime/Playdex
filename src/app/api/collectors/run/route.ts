import { runNewsCollector } from "@/collectors/news-collector";

export const runtime = "nodejs";

export async function POST() {
  const news = await runNewsCollector();

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
