import type { NewsCollectorHealth } from "@/lib/news-health";

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function NewsCollectorHealthPanel({ health }: { health: NewsCollectorHealth }) {
  const unhealthy = health.status !== "healthy";

  return (
    <section
      className={`rounded-2xl border p-5 ${
        unhealthy ? "border-rose-400/30 bg-rose-500/10" : "border-emerald-400/25 bg-emerald-500/10"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400">
            News collector health
          </p>
          <h2 className={`mt-2 text-lg font-semibold ${unhealthy ? "text-rose-50" : "text-emerald-50"}`}>
            {unhealthy ? "NEWS COLLECTOR PROBLEM" : "News collector healthy"}
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
          {health.status}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-zinc-500">Last successful run</dt>
          <dd className="mt-1 text-white">{formatDate(health.lastSuccessAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last attempted run</dt>
          <dd className="mt-1 text-white">{formatDate(health.lastAttemptAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Next expected run</dt>
          <dd className="mt-1 text-white">{formatDate(health.nextExpectedRunAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last article date</dt>
          <dd className="mt-1 text-white">{formatDate(health.lastNewArticleAt)}</dd>
        </div>
      </dl>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-zinc-500">Active sources</dt>
          <dd className="mt-1 text-white">{health.activeSources}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Articles collected in 24h</dt>
          <dd className="mt-1 text-white">{health.articlesLast24h}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Homepage eligible</dt>
          <dd className="mt-1 text-white">{health.homepageEligible}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Without images</dt>
          <dd className="mt-1 text-white">{health.articlesWithoutImages}</dd>
        </div>
      </dl>

      {health.failingSources.length ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-100/80">
            Failing sources
          </p>
          {health.failingSources.slice(0, 6).map((source) => (
            <p key={source.id} className="text-sm text-rose-50">
              {source.name}: {source.lastError ?? "No error message"}{" "}
              <span className="text-rose-100/70">({source.consecutiveFailures} failures)</span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
