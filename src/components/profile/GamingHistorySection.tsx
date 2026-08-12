import Image from "next/image";
import { getGameDisplayIcon } from "@/data/android-tracked-games";
import type { GamingUsageAggregate } from "@/lib/gaming-stats";
import { formatRelativeLastPlayed } from "@/lib/game-usage/format";

export function GamingHistorySection({
  history,
}: {
  history: GamingUsageAggregate[];
}) {
  if (history.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Gaming History</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Synced playtime from your Android tracker will appear here over time.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Gaming History</h2>
      <p className="mt-1 text-sm text-zinc-500">Last 90 days of synced activity</p>
      <ul className="mt-4 space-y-2">
        {history.map((game) => {
          const icon = getGameDisplayIcon(game.gameSlug) ?? "/game-fallbacks/default.svg";
          return (
            <li
              key={game.gameSlug}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <Image src={icon} alt="" width={40} height={40} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{game.gameName}</p>
                <p className="text-xs text-zinc-500">
                  {game.activeDays} active days
                  {game.lastPlayedAt
                    ? ` · last played ${formatRelativeLastPlayed(new Date(game.lastPlayedAt).getTime())}`
                    : ""}
                </p>
              </div>
              <p className="text-sm font-semibold text-indigo-100">{game.formattedPlaytime}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
