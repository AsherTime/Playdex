import Link from "next/link";

const IMPROVE_GAMES = [
  {
    slug: "valorant",
    title: "Valorant",
    href: "/games/valorant/improve",
    description:
      "Build a custom aim, utility, and ranked routine from your rank, role, and weaknesses.",
    accent: "from-rose-500/20 to-orange-500/10",
    badge: "border-rose-400/30 bg-rose-500/10 text-rose-100",
    cta: "border-rose-400/35 bg-rose-500/15 text-rose-50 hover:bg-rose-500/25",
    tags: ["Aim routine", "Agent utility", "Ranked focus"],
  },
  {
    slug: "free-fire",
    title: "Free Fire",
    href: "/games/free-fire/improve",
    description:
      "Get a daily Free Fire plan covering aim, gloo walls, movement, and Clash Squad / BR ranked.",
    accent: "from-orange-500/20 to-amber-500/10",
    badge: "border-orange-400/30 bg-orange-500/10 text-orange-100",
    cta: "border-orange-400/35 bg-orange-500/15 text-orange-50 hover:bg-orange-500/25",
    tags: ["Gloo routine", "Movement", "Ranked tracker"],
  },
] as const;

export default function ImproveHubPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
            Improvement planner
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Choose a game to improve
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-[15px]">
            Pick Valorant or Free Fire. Use a guided questionnaire, or make your own daily
            routine and track progress for 7 days.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {IMPROVE_GAMES.map((game) => (
          <article
            key={game.slug}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className={`h-28 bg-gradient-to-br ${game.accent}`}>
              <div className="h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">{game.title}</h2>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${game.badge}`}
                  >
                    Training plan
                  </span>
                </div>
                <p className="text-sm leading-6 text-zinc-400">{game.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={game.href}
                  className={`inline-flex rounded-full border px-5 py-2.5 text-sm font-medium transition ${game.cta}`}
                >
                  Guided plan
                </Link>
                <Link
                  href={`${game.href}/custom`}
                  className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Make your own
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
