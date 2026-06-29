import { runNewsCollector } from "@/collectors/mock-collectors";

export const runtime = "nodejs";

export async function POST() {
  return Response.json(await runNewsCollector());
}
