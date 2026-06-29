import type { Game } from "@/types/gamedex";

export function GameCover({ game }: { game: Pick<Game, "title" | "coverTone"> }) {
  return (
    <div
      className={`flex aspect-[4/5] w-full items-end rounded-2xl border border-white/10 bg-gradient-to-br ${game.coverTone} p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]`}
    >
      <div className="rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
        {game.title}
      </div>
    </div>
  );
}
