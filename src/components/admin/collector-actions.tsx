"use client";

import { useState } from "react";
import type { BackfillImagesResult } from "@/lib/backfill-news-images";
import type { CollectorRunResult } from "@/types/gamedex";

export function CollectorActions() {
  const [collectorResult, setCollectorResult] = useState<CollectorRunResult | null>(null);
  const [backfillResult, setBackfillResult] = useState<BackfillImagesResult | null>(null);
  const [pendingAction, setPendingAction] = useState<"collector" | "backfill" | null>(null);

  async function runNewsCollector() {
    setPendingAction("collector");
    setBackfillResult(null);
    const response = await fetch("/api/collectors/news", { method: "POST" });
    const payload = (await response.json()) as CollectorRunResult;
    setCollectorResult(payload);
    setPendingAction(null);
  }

  async function runBackfillImages() {
    setPendingAction("backfill");
    setCollectorResult(null);
    const response = await fetch("/api/admin/backfill-images", { method: "POST" });
    const payload = (await response.json()) as BackfillImagesResult;
    setBackfillResult(payload);
    setPendingAction(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          onClick={runNewsCollector}
          disabled={pendingAction !== null}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "collector" ? "Running…" : "Run News Collector"}
        </button>
        <button
          onClick={runBackfillImages}
          disabled={pendingAction !== null}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "backfill" ? "Running…" : "Backfill Missing Images"}
        </button>
      </div>

      {collectorResult ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <p>
            {collectorResult.message} {collectorResult.processedRecords} records processed.
          </p>
          {collectorResult.errors?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-100">
              {collectorResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {backfillResult ? (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
          <p>{backfillResult.message}</p>
          <p className="mt-2 text-cyan-100/90">
            Processed {backfillResult.processed} items · Found {backfillResult.found} · Fallback{" "}
            {backfillResult.fallback}
          </p>
          {backfillResult.errors.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-100">
              {backfillResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
