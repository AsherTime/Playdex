import type { GameNews } from "@/types/gamedex";
import { NewsCardImage } from "@/components/news-card-image";
import { formatRelativeTime } from "@/utils/formatters";

export function NewsCard({ item }: { item: GameNews }) {
  const body = (
    <article className="group flex min-h-[9.5rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] transition duration-200 hover:border-white/20 hover:from-white/[0.06] hover:to-white/[0.025] hover:shadow-[0_16px_48px_-16px_rgba(0,0,0,0.9)] sm:min-h-[11rem] md:min-h-[12rem]">
      <NewsCardImage imageUrl={item.imageUrl} gameId={item.gameId} />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 px-4 py-4 sm:gap-3 sm:px-5 sm:py-5 md:px-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
          <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 font-medium tracking-wide text-zinc-200">
            {item.category}
          </span>
          <span className="rounded-md bg-indigo-400/10 px-2 py-0.5 font-medium text-indigo-100/90">{item.gameTag}</span>
          <span className="text-zinc-500">{item.source}</span>
          <time className="ml-auto shrink-0 text-zinc-500" dateTime={item.date}>
            {formatRelativeTime(item.date)}
          </time>
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-white transition group-hover:text-indigo-50 sm:text-lg sm:leading-7 md:text-xl">
          {item.title}
        </h3>

        <p className="line-clamp-2 text-sm leading-6 text-zinc-400 sm:line-clamp-3">{item.summary}</p>

        {item.url ? (
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300/80 transition group-hover:text-indigo-200">
            Read article
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18m0 0v4.5M18 6l-8.25 8.25M6 18h10.5a1.5 1.5 0 001.5-1.5V9" />
            </svg>
          </span>
        ) : null}
      </div>
    </article>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className="block">
        {body}
      </a>
    );
  }

  return body;
}
