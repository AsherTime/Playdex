import Link from "next/link";
import { ImproveCard } from "@/components/valorant-improve/ImproveShell";

const PREVIEW_ITEMS = [
  { title: "Daily tasks", detail: "Short, focused drills matched to your schedule." },
  { title: "Rank improvement tracker", detail: "Track day-by-day progress across a 7-day cycle." },
  { title: "Aim routine", detail: "Warm-ups based on your weapon and weakness profile." },
  { title: "Game sense routine", detail: "Review and positioning notes after ranked." },
  { title: "Progress bar", detail: "Check off tasks and unlock the next training day." },
];

export function ImproveLanding() {
  return (
    <div className="space-y-6">
      <ImproveCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-rose-300/80">
              Valorant improvement planner
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Get your custom Valorant improvement plan
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-[15px]">
              Answer a few questions about your rank, agents, weaknesses, and practice time.
              Gamedex builds a daily routine with tasks, progress tracking, and re-check prompts —
              no guesswork, just a clear path to improve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/games/valorant/improve/questions"
                className="inline-flex rounded-full border border-rose-400/35 bg-rose-500/15 px-5 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-500/25"
              >
                Start guided plan
              </Link>
              <Link
                href="/games/valorant/improve/custom"
                className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Make your own plan
              </Link>
              <Link
                href="/games/valorant/improve/plan"
                className="inline-flex rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                View my plan
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              What you get
            </p>
            <ul className="space-y-3">
              {PREVIEW_ITEMS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ImproveCard>
    </div>
  );
}
