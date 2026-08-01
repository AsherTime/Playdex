import Link from "next/link";
import { FreeFireImproveCard } from "@/components/free-fire-improve/FreeFireImproveShell";

const PREVIEW_ITEMS = [
  {
    title: "Daily training tasks",
    detail: "Short drills matched to your Free Fire schedule and rank goals.",
  },
  {
    title: "Rank improvement tracker",
    detail: "Track day-by-day progress across a 7-day training cycle.",
  },
  {
    title: "Aim routine",
    detail: "Training Ground warm-ups and headshot practice based on weaknesses.",
  },
  {
    title: "Gloo wall routine",
    detail: "Placement speed and ability timing for safer peeks and clutches.",
  },
  {
    title: "Movement routine",
    detail: "Jump, slide, and drop-timing drills for cleaner fights.",
  },
  {
    title: "Game sense routine",
    detail: "Rotation, positioning, and review notes after ranked.",
  },
];

export function FreeFireImproveLanding() {
  return (
    <div className="space-y-6">
      <FreeFireImproveCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-orange-300/80">
              Free Fire improvement planner
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Get your custom Free Fire training plan
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-[15px]">
              Answer a few questions about your rank, characters, weaknesses, and practice time.
              Gamedex builds a daily Free Fire routine with aim, gloo, movement, and ranked focus —
              plus progress tracking to keep you consistent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/games/free-fire/improve/questions"
                className="inline-flex rounded-full border border-orange-400/35 bg-orange-500/15 px-5 py-2.5 text-sm font-medium text-orange-50 transition hover:bg-orange-500/25"
              >
                Start guided plan
              </Link>
              <Link
                href="/games/free-fire/improve/custom"
                className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Make your own plan
              </Link>
              <Link
                href="/games/free-fire/improve/plan"
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
      </FreeFireImproveCard>
    </div>
  );
}
