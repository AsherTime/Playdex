import type { TrendStatus } from "@/types/gamedex";

const styles: Record<TrendStatus, string> = {
  Exploding: "bg-fuchsia-400/15 text-fuchsia-200 ring-fuchsia-300/30",
  Rising: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
  Stable: "bg-sky-400/15 text-sky-200 ring-sky-300/30",
  Dropping: "bg-rose-400/15 text-rose-200 ring-rose-300/30",
};

export function TrendBadge({ status }: { status: TrendStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[status]}`}>
      {status}
    </span>
  );
}
