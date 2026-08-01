import Link from "next/link";

export function ImproveShell({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: string;
}) {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-zinc-500">
        <Link href="/games/valorant" className="transition hover:text-white">
          Valorant
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <Link href="/games/valorant/improve" className="transition hover:text-white">
          Improve
        </Link>
        {breadcrumb ? (
          <>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-zinc-300">{breadcrumb}</span>
          </>
        ) : null}
      </nav>
      {children}
    </div>
  );
}

export function ImproveCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${className}`}
    >
      {children}
    </section>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{label}</span>
          <span className="tabular-nums text-zinc-300">{value}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
