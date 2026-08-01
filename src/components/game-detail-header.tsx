import type { GameDetail } from "@/types/gamedex";
import { formatDate } from "@/utils/formatters";

export function GameDetailHeader({ game }: { game: GameDetail }) {
  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[180px_1fr]">
      <div className={`min-h-56 rounded-[1.75rem] bg-gradient-to-br ${game.coverTone}`} />
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">Released {formatDate(game.releaseDate)}</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{game.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{game.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
          <span className="rounded-full bg-white/5 px-3 py-1">{game.genre}</span>
          {game.platforms.map((platform) => (
            <span key={platform} className="rounded-full bg-white/5 px-3 py-1">
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
