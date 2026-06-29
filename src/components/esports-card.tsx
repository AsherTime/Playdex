import type { EsportsEvent } from "@/types/gamedex";
import { formatDate } from "@/utils/formatters";

export function EsportsCard({ event }: { event: EsportsEvent }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="font-medium text-white">{event.title}</p>
      <p className="mt-1 text-sm text-zinc-400">
        {event.game} · {event.region}
      </p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-500">{formatDate(event.date)}</span>
        <span className="text-indigo-100">{event.prizePool}</span>
      </div>
    </article>
  );
}
