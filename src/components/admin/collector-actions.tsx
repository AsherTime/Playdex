"use client";

import { useState } from "react";
import type { CollectorRunResult } from "@/types/gamedex";

const collectors = [
  { key: "run", label: "Run All Collectors" },
  { key: "steam", label: "Run Steam Collector" },
  { key: "twitch", label: "Run Twitch Collector" },
  { key: "news", label: "Run News Collector" },
] as const;

export function CollectorActions() {
  const [result, setResult] = useState<CollectorRunResult | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function runCollector(key: (typeof collectors)[number]["key"]) {
    setPending(key);
    const response = await fetch(`/api/collectors/${key}`, { method: "POST" });
    const payload = (await response.json()) as CollectorRunResult;
    setResult(payload);
    setPending(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {collectors.map((collector) => (
          <button
            key={collector.key}
            onClick={() => runCollector(collector.key)}
            disabled={pending !== null}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === collector.key ? "Running…" : collector.label}
          </button>
        ))}
      </div>
      {result ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <p>
            {result.message} {result.processedRecords} records processed.
          </p>
          {result.errors?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-100">
              {result.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
