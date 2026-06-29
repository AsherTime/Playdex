import type { Streamer } from "@/types/gamedex";
import { formatCompactNumber } from "@/utils/formatters";

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{streamer.name}</p>
          <p className="text-sm text-zinc-400">{streamer.currentGame}</p>
        </div>
        <span className="rounded-full bg-violet-400/15 px-2 py-1 text-xs text-violet-100">{streamer.platform}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-500">{formatCompactNumber(streamer.followers)} followers</span>
        <a href={streamer.href} target="_blank" rel="noreferrer" className="text-indigo-200">
          Open ↗
        </a>
      </div>
    </article>
  );
}
