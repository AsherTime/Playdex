import Link from "next/link";

const QUICK_STARTS = [
  {
    title: "Valorant",
    href: "/games/valorant/improve",
    customHref: "/games/valorant/improve/custom",
    detail: "Aim, utility, and ranked focus routines.",
    accent: "border-rose-400/25 bg-rose-500/10 text-rose-100",
    cta: "border-rose-400/30 bg-rose-500/15 text-rose-50 hover:bg-rose-500/25",
  },
  {
    title: "Free Fire",
    href: "/games/free-fire/improve",
    customHref: "/games/free-fire/improve/custom",
    detail: "Gloo, movement, Clash Squad, and BR drills.",
    accent: "border-orange-400/25 bg-orange-500/10 text-orange-100",
    cta: "border-orange-400/30 bg-orange-500/15 text-orange-50 hover:bg-orange-500/25",
  },
] as const;

export function ImproveQuickStartCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
              Improvement
            </p>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Quick-start training</h2>
            <p className="text-sm text-zinc-400">
              Jump into a guided plan or build your own daily routine.
            </p>
          </div>
          <Link
            href="/improve"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            View all planners
          </Link>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {QUICK_STARTS.map((game) => (
          <article
            key={game.title}
            className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${game.accent}`}
                >
                  Training plan
                </span>
                <h3 className="text-base font-semibold text-white">{game.title}</h3>
                <p className="text-sm leading-6 text-zinc-400">{game.detail}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={game.href}
                className={`inline-flex rounded-full border px-3.5 py-2 text-xs font-medium transition ${game.cta}`}
              >
                Guided plan
              </Link>
              <Link
                href={game.customHref}
                className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
              >
                Make your own
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
