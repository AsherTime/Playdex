"use client";

import { useState, useTransition } from "react";
import { approveGuideRevisionAction, rejectGuideRevisionAction } from "@/app/admin/reviews/actions";

export function GuideReviewActions({ revisionId, disabled }: { revisionId: string; disabled: boolean }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function approve() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await approveGuideRevisionAction(revisionId);
        setMessage("Revision approved and published.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not approve revision.");
      }
    });
  }

  function reject() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await rejectGuideRevisionAction(revisionId, note);
        setMessage("Revision rejected.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not reject revision.");
      }
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="text-base font-semibold text-white">Review Decision</h2>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        placeholder="Optional rejection note"
        className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/40"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={disabled || isPending}
          className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve & Publish
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={disabled || isPending}
          className="rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {message ? <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-2 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-2 text-sm text-rose-100">{error}</p> : null}
    </section>
  );
}
