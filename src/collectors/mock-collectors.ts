import type { CollectorRunResult } from "@/types/gamedex";
import { runNewsCollector as runRealNewsCollector } from "./news-collector";

function createResult(
  collector: CollectorRunResult["collector"],
  processedRecords: number,
  message: string,
): CollectorRunResult {
  return {
    collector,
    status: "completed",
    collectedAt: new Date().toISOString(),
    processedRecords,
    message,
  };
}

export async function runSteamCollector() {
  return createResult("steam", 10, "Mock Steam snapshot collected successfully.");
}

export async function runTwitchCollector() {
  return createResult("twitch", 10, "Mock Twitch snapshot collected successfully.");
}

export async function runNewsCollector() {
  return runRealNewsCollector();
}
