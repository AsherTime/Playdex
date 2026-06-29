import Link from "next/link";
import type { RecentlyViewedGame } from "@/types/gamedex";

export function RecentlyViewedGames({ games }: { games: RecentlyViewedGame[] }) {
  return (
    <section className="space-y-3">
      <p className="px-3 text-xs uppercase tracking-[0.24em] text-zinc-500">Recently Viewed Games</p>
      <div className="space-y-2">
        {games.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/[0.05]"
          >
            <span className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${game.coverTone}`} />
            <span>
              <span className="block text-sm font-medium text-white">{game.title}</span>
              <span className="block text-xs text-zinc-500">{game.genre}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
