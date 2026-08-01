import type { GamePost } from "@/types/gamedex";
import { formatRelativeTime } from "@/utils/formatters";

function displayDate(post: GamePost) {
  if (post.publishedAt) return formatRelativeTime(post.publishedAt);
  return post.timeAgo;
}

export function EditorialPostCard({ post }: { post: GamePost }) {
  const dateLabel = displayDate(post);
  const dateTime = post.publishedAt ?? undefined;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition duration-200 hover:border-white/20 hover:bg-white/[0.05]">
      <div className={`relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br ${post.thumbnailTone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.16),transparent_45%)]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070811]/80 to-transparent" />
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {post.isEditorial ? (
            <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 font-medium text-amber-100">
              Editorial · Mock
            </span>
          ) : null}
          <span className="rounded-md border border-indigo-400/20 bg-indigo-400/10 px-2 py-0.5 font-medium text-indigo-100">
            {post.gameTag}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-zinc-300">{post.category}</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-white transition group-hover:text-indigo-50 sm:text-xl">
            {post.title}
          </h3>
          <p className="text-sm leading-6 text-zinc-400">{post.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-300">{post.author ?? post.source}</span>
          <span aria-hidden="true">·</span>
          {dateTime ? <time dateTime={dateTime}>{dateLabel}</time> : <span>{dateLabel}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          <button
            type="button"
            className="rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-400/20"
          >
            Open
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            Share
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            Save
          </button>
        </div>
      </div>
    </article>
  );
}
