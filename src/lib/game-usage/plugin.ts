import { registerPlugin } from "@capacitor/core";

import type { GameUsagePlugin } from "@/lib/game-usage/types";

const GameUsage = registerPlugin<GameUsagePlugin>("GameUsage", {
  web: () => import("./game-usage-web").then((m) => new m.GameUsageWeb()),
});

export default GameUsage;
