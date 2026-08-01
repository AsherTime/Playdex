import type { GameNews } from "@/types/gamedex";
import { NewsTrackerThumb } from "@/components/news-tracker-thumb";
import { formatRelativeTime } from "@/utils/formatters";

export function NewsTrackerCard({ item }: { item: GameNews }) {
  const body = (
    <article className="group flex w-[248px] shrink-0 gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:from-white/[0.07] hover:to-white/[0.03] sm:w-[268px]">
      <NewsTrackerThumb imageUrl={item.imageUrl} gameId={item.gameId} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
          <span className="rounded-md border border-indigo-400/20 bg-indigo-400/15 px-1.5 py-0.5 font-medium text-indigo-100/90">
            {item.gameTag}
          </span>
          <span className="truncate">{item.source}</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white transition group-hover:text-cyan-50">
          {item.title}
        </h3>
        <time className="block text-[11px] text-zinc-500" dateTime={item.date}>
          {formatRelativeTime(item.date)}
        </time>
      </div>
    </article>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className="block shrink-0">
        {body}
      </a>
    );
  }

  return <div className="shrink-0">{body}</div>;
}
