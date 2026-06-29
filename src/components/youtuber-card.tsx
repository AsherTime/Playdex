import type { YouTuber } from "@/types/gamedex";
import { formatCompactNumber } from "@/utils/formatters";

export function YouTuberCard({ creator }: { creator: YouTuber }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{creator.name}</p>
          <p className="text-sm text-zinc-400">{creator.trendingTopic}</p>
        </div>
        <span className="rounded-full bg-sky-400/15 px-2 py-1 text-xs text-sky-100">YouTube</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-500">{formatCompactNumber(creator.subscribers)} subs</span>
        <a href={creator.href} target="_blank" rel="noreferrer" className="text-indigo-200">
          Open ↗
        </a>
      </div>
    </article>
  );
}
