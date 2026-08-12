"use client";

import { getGameDisplayIcon } from "@/data/android-tracked-games";
import { formatPlaytimeSeconds } from "@/lib/game-usage/format";
import Image from "next/image";

export function GamingSummaryShareCard({
  displayName,
  username,
  weekTotalSeconds,
  gamesPlayed,
  topGames,
  focusLine,
}: {
  displayName: string;
  username: string;
  weekTotalSeconds: number;
  gamesPlayed: number;
  topGames: Array<{ gameSlug: string; name: string; seconds: number }>;
  focusLine?: string;
}) {
  return (
    <div
      id="gaming-summary-share-card"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070811] p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.25),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(34,211,238,0.15),transparent_40%)]" />
      <div className="relative space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
          Gamedex
        </p>
        <div>
          <h3 className="text-xl font-semibold text-white">{displayName}&apos;s Gaming Week</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {formatPlaytimeSeconds(weekTotalSeconds)} played · {gamesPlayed} game
            {gamesPlayed === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-2">
          {topGames.slice(0, 3).map((game, index) => {
            const icon = getGameDisplayIcon(game.gameSlug) ?? "/game-fallbacks/default.svg";
            return (
              <div key={game.gameSlug} className="flex items-center gap-3 rounded-xl bg-black/30 px-3 py-2">
                <span className="w-5 text-xs font-semibold text-zinc-500">#{index + 1}</span>
                <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                  <Image src={icon} alt="" width={32} height={32} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{game.name}</p>
                </div>
                <p className="text-sm font-medium text-indigo-100">
                  {formatPlaytimeSeconds(game.seconds)}
                </p>
              </div>
            );
          })}
        </div>
        {focusLine ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Current focus</p>
            <p className="mt-1 text-sm text-zinc-200">{focusLine}</p>
          </div>
        ) : null}
        <p className="text-sm text-zinc-500">@{username}</p>
      </div>
    </div>
  );
}
