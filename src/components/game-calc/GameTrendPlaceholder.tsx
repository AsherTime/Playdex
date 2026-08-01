export function GameTrendPlaceholder() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">Coming soon</p>
        <h2 className="text-sm font-semibold text-white sm:text-base">Platform trends</h2>
      </div>
      <div className="flex h-28 items-end gap-2 rounded-xl border border-dashed border-white/10 bg-black/20 px-4 pb-4">
        {[40, 62, 48, 72, 55, 68, 44].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500/25 to-indigo-300/10"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Twitch and YouTube trend graphs will appear here once platform tracking is enabled.
      </p>
    </section>
  );
}
