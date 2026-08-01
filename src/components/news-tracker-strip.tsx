import Link from "next/link";
import type { GameNews } from "@/types/gamedex";
import { NewsTrackerCard } from "@/components/news-tracker-card";

export function NewsTrackerStrip({
  items,
  viewAllHref = "/news",
}: {
  items: GameNews[];
  viewAllHref?: string;
}) {
  if (!items.length) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-300/80">
                Live tracker
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Live
              </span>
            </div>
            <h2 className="text-sm font-semibold text-white sm:text-base">
              Latest tracked updates
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            View all
          </Link>
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {items.map((item) => (
            <NewsTrackerCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
