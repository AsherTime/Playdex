import { execFile } from "node:child_process";
import dns from "node:dns";
import { promisify } from "node:util";

dns.setDefaultResultOrder("ipv4first");

const execFileAsync = promisify(execFile);
const GAME8_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function fetchGame8Html(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": GAME8_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(25000),
    });

    if (response.ok) {
      return response.text();
    }
  } catch {
    // Fall back to curl when Node DNS/fetch fails in some environments.
  }

  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  const { stdout } = await execFileAsync(
    curlBin,
    ["-4", "-L", "-A", GAME8_USER_AGENT, "--max-time", "25", url],
    { maxBuffer: 12 * 1024 * 1024 },
  );

  return stdout;
}
