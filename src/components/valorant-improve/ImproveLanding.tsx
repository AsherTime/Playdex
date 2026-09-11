"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImproveCard } from "@/components/valorant-improve/ImproveShell";
import { loadPlan } from "@/lib/valorant-improve-storage";

export function ImproveLanding() {
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    setHasPlan(Boolean(loadPlan()));
  }, []);

  return (
    <div className="space-y-6">
      <ImproveCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative space-y-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-rose-300/80">
            Valorant coach
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Analyze your matches. Train the leak. Measure the change.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-[15px]">
            Connect your Riot account to let Playdex analyze your matches and automatically
            personalize your training.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-zinc-400"
            >
              Connect Riot Account
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                Coming Soon
              </span>
            </button>
            <Link
              href="/games/valorant/improve/questions"
              className="inline-flex rounded-full border border-rose-400/35 bg-rose-500/15 px-5 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-500/25"
            >
              Continue Manually
            </Link>
            {hasPlan ? (
              <Link
                href="/games/valorant/improve/dashboard"
                className="inline-flex rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Open dashboard
              </Link>
            ) : null}
          </div>
          <p className="text-xs text-zinc-600">
            Riot sign-in needs official production API access. Until then, Continue Manually uses
            a short questionnaire and labeled sample analysis.
          </p>
        </div>
      </ImproveCard>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Diagnose", detail: "See the weakness that is actually costing rounds." },
          { title: "Train today", detail: "A compact plan sized to the time you have." },
          { title: "Measure", detail: "Track whether the same leak is shrinking." },
        ].map((item) => (
          <ImproveCard key={item.title} className="p-4">
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{item.detail}</p>
          </ImproveCard>
        ))}
      </div>
    </div>
  );
}
