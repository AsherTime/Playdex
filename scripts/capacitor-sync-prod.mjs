/**
 * Sync Capacitor Android using CAPACITOR_SERVER_URL from .env.local / environment.
 * Example .env.local:
 *   CAPACITOR_SERVER_URL=https://your-app.vercel.app
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envLocalPath = path.join(root, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(envLocalPath);

const serverUrl = process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!serverUrl) {
  console.error(
    "Missing CAPACITOR_SERVER_URL (or NEXT_PUBLIC_APP_URL). Set it in .env.local before syncing the Android app.",
  );
  process.exit(1);
}

console.log(`Syncing Android shell → ${serverUrl}`);

const result = spawnSync("npx", ["cap", "sync", "android"], {
  stdio: "inherit",
  env: { ...process.env, CAPACITOR_SERVER_URL: serverUrl },
  shell: true,
});

process.exit(result.status ?? 1);
