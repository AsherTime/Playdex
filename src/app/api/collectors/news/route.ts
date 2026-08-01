import { runNewsCollector } from "@/collectors/news-collector";
import { verifyCollectorCronRequest } from "@/lib/collector-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = verifyCollectorCronRequest(request);
  if (unauthorized) return unauthorized;

  return Response.json(await runNewsCollector({ force: false }));
}
