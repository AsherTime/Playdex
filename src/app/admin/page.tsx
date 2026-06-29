import { CollectorActions } from "@/components/admin/collector-actions";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { getDashboardSummary } from "@/lib/dashboard";
import { formatDate } from "@/utils/formatters";

export default async function AdminPage() {
  const dashboard = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Internal"
        title="Admin / Data Dashboard"
        description="A compact control room for collection health and data freshness."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Games tracked" value={dashboard.totalGamesTracked} />
        <StatCard label="News items" value={dashboard.totalNewsItems} />
        <StatCard
          label="Latest metrics"
          value={dashboard.latestCollectedMetrics}
          helper={formatDate(dashboard.latestMetricDate)}
        />
        <StatCard label="Update sources" value={dashboard.sources.length} helper="Collector inputs" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <SectionHeader title="Source status" />
          <div className="mt-4 space-y-3">
            {dashboard.sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{source.name}</p>
                  <p className="text-sm text-zinc-400">
                    Every {source.cadence}
                    {source.sourceType ? ` / ${source.sourceType}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{source.status}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(source.lastCollectedAt).toLocaleTimeString("en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {source.lastError ? <p className="text-xs text-rose-200">{source.lastError}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <SectionHeader title="Collector controls" />
          <div className="mt-4">
            <CollectorActions />
          </div>
        </div>
      </section>
    </div>
  );
}
