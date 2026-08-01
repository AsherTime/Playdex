import Link from "next/link";

export function HomeHero({
  followedCount = 0,
}: {
  followedCount?: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(34,211,238,0.14),transparent_36%),radial-gradient(circle_at_88%_10%,rgba(99,102,241,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]" />
      <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </span>
            Live gaming intel
          </div>

          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Track the meta. Train smarter. Stay ahead.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-zinc-400 sm:text-[15px]">
              Gamedex pulls live updates, editorial guides, and personal improvement plans into one
              dark command center for competitive and live-service games.
              {followedCount > 0
                ? ` Your ${followedCount} followed game${followedCount === 1 ? "" : "s"} are prioritized in the tracker.`
                : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/news"
              className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/20"
            >
              Open live tracker
            </Link>
            <Link
              href="/improve"
              className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Start improvement plan
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Tracked feeds", value: "News + patches", tone: "text-cyan-200" },
            { label: "Training loops", value: "Valorant · Free Fire", tone: "text-indigo-200" },
            { label: "Personalization", value: "Followed-game first", tone: "text-emerald-200" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-sm"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {item.label}
              </p>
              <p className={`mt-1 text-sm font-semibold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
