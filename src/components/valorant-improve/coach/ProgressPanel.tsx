import { ImproveCard } from "@/components/valorant-improve/ImproveShell";
import type { ProgressSeries } from "@/lib/valorant-coach/types";

export function ProgressPanel({
  series,
  range,
  onRange,
}: {
  series: ProgressSeries[];
  range: 7 | 30 | 90;
  onRange: (value: 7 | 30 | 90) => void;
}) {
  return (
    <div className="space-y-4">
      <ImproveCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Are you actually improving?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Training completion is yours. Other lines use the same analysis model and stay
              labeled until Riot history exists.
            </p>
          </div>
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onRange(value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  range === value
                    ? "border-rose-400/40 bg-rose-500/15 text-rose-50"
                    : "border-white/10 text-zinc-400"
                }`}
              >
                {value} Days
              </button>
            ))}
          </div>
        </div>
      </ImproveCard>

      <div className="grid gap-3 md:grid-cols-2">
        {series.map((item) => (
          <ImproveCard key={item.key} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                {item.source === "questionnaire" ? "Your plan" : "Modeled"}
              </span>
            </div>
            <div className="mt-4 flex h-16 items-end gap-1">
              {item.points.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-rose-500/70 to-orange-300/70"
                    style={{ height: `${Math.max(8, point.value)}%` }}
                  />
                  <span className="text-[9px] text-zinc-600">{point.label}</span>
                </div>
              ))}
            </div>
          </ImproveCard>
        ))}
      </div>
    </div>
  );
}
