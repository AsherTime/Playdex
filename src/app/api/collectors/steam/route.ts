import { runSteamCollector } from "@/collectors/mock-collectors";

export const runtime = "nodejs";

export async function POST() {
  return Response.json(await runSteamCollector());
}
