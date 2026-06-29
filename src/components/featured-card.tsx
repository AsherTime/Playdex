import type { GamePost } from "@/types/gamedex";

export function FeaturedCard({ post }: { post: GamePost }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
      <div className={`h-28 bg-gradient-to-br ${post.thumbnailTone}`} />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{post.category}</span>
          <span>{post.timeAgo}</span>
        </div>
        <h3 className="text-base font-medium leading-6 text-white">{post.title}</h3>
        <p className="text-sm text-zinc-400">{post.gameTag}</p>
      </div>
    </article>
  );
}
