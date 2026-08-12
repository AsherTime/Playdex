import type {
  GameUsagePlugin,
  GameUsageQueryResult,
} from "@/lib/game-usage/types";

export class GameUsageWeb implements GameUsagePlugin {
  async hasUsageAccess(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async openUsageAccessSettings(): Promise<void> {
    throw new Error("Device game tracking is only available in the Android app.");
  }

  async getGameUsage(): Promise<GameUsageQueryResult> {
    return { records: [], periodStart: 0, periodEnd: 0 };
  }
}
