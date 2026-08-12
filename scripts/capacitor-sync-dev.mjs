/**
 * Dev sync for Android emulator (host machine Next.js at localhost:3000).
 * Emulator maps 10.0.2.2 → your PC's localhost.
 */
import { spawnSync } from "node:child_process";

const serverUrl = process.env.CAPACITOR_SERVER_URL || "http://10.0.2.2:3000";

console.log(`Dev sync → ${serverUrl}`);
console.log("Run `npm run dev` on your machine before launching the app.");

const result = spawnSync("npx", ["cap", "sync", "android"], {
  stdio: "inherit",
  env: {
    ...process.env,
    CAPACITOR_SERVER_URL: serverUrl,
    CAPACITOR_LIVE_RELOAD: "true",
  },
  shell: true,
});

process.exit(result.status ?? 1);
