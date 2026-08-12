export type GameUsageRecord = {
  packageName: string;
  foregroundMs: number;
  lastUsed: number;
  sessionCount: number;
};

export type GameUsageQueryResult = {
  records: GameUsageRecord[];
  periodStart: number;
  periodEnd: number;
};

export type NormalizedGameUsage = {
  gameSlug: string;
  gameName: string;
  packageName: string;
  foregroundMs: number;
  formattedPlaytime: string;
  lastUsed: number;
  sessionCount: number;
  periodStart: number;
  periodEnd: number;
};

export interface GameUsagePlugin {
  hasUsageAccess(): Promise<{ granted: boolean }>;
  openUsageAccessSettings(): Promise<void>;
  getGameUsage(options: {
    startTime: number;
    endTime: number;
    packageNames: string[];
  }): Promise<GameUsageQueryResult>;
}
