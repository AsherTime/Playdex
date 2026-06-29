import type { GamePost } from "@/types/gamedex";

export function PostCard({ post }: { post: GamePost }) {
  const title = post.url ? (
    <a href={post.url} target="_blank" rel="noreferrer" className="transition hover:text-cyan-200">
      {post.title}
    </a>
  ) : (
    post.title
  );

  return (
    <article className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 transition hover:border-indigo-300/20 hover:bg-white/[0.05] sm:grid-cols-[180px_1fr]">
      <div className={`min-h-36 rounded-[1.5rem] bg-gradient-to-br ${post.thumbnailTone}`} />
      <div className="flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{post.source}</span>
            <span>/</span>
            <span>{post.timeAgo}</span>
          </div>
          <h3 className="text-lg font-medium leading-7 text-white">{title}</h3>
          <p className="text-sm leading-6 text-zinc-400">{post.summary}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-indigo-400/15 px-3 py-1 text-indigo-100">{post.gameTag}</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">{post.category}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <button type="button" className="rounded-full border border-white/10 px-3 py-1 transition hover:bg-white/[0.05]">
              Bookmark
            </button>
            <span>128 votes</span>
            <span>24 comments</span>
          </div>
        </div>
      </div>
    </article>
  );
}
