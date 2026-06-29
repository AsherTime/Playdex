import type { GameNews } from "@/types/gamedex";
import { formatDate } from "@/utils/formatters";

export function NewsCard({ item }: { item: GameNews }) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <span className="rounded-full bg-white/5 px-2.5 py-1">{item.category}</span>
        <span>{item.source}</span>
        <span>/</span>
        <span>{formatDate(item.date)}</span>
      </div>
      <h3 className="mt-4 text-lg font-medium text-white">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{item.summary}</p>
      <p className="mt-4 text-sm text-cyan-200">{item.gameTag}</p>
    </>
  );

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]">
      {item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </article>
  );
}
