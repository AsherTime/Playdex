"use client";

import { useMemo, useState } from "react";
import { NewsCard } from "@/components/news-card";
import { hasFeedThumbnail } from "@/lib/news-images";
import type { GameNews } from "@/types/gamedex";

const ALL_GAMES = "all";

export function HomeNewsExplorer({
  items,
}: {
  items: GameNews[];
}) {
  const [selectedGame, setSelectedGame] = useState(ALL_GAMES);
  const [query, setQuery] = useState("");

  const feedItems = useMemo(
    () => items.filter((item) => hasFeedThumbnail(item.imageUrl)),
    [items],
  );

  const gameOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of feedItems) {
      if (item.gameId && !seen.has(item.gameId)) {
        seen.set(item.gameId, item.gameTag);
      }
    }
    return [...seen.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [feedItems]);

  const normalizedQuery = query.trim().toLowerCase();

  const visibleItems = useMemo(() => {
    return feedItems.filter((item) => {
      if (selectedGame !== ALL_GAMES && item.gameId !== selectedGame) return false;
      if (!normalizedQuery) return true;
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.gameTag.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [feedItems, selectedGame, normalizedQuery]);

  const isFiltered = selectedGame !== ALL_GAMES || Boolean(normalizedQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search news"
            aria-label="Search news"
            className="w-full rounded-xl border border-white/10 bg-black/25 py-2.5 pl-3.5 pr-9 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-indigo-300/40 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden="true" className="text-base leading-none">
                ×
              </span>
            </button>
          ) : null}
        </div>

        <div className="relative shrink-0 sm:w-52">
          <select
            value={selectedGame}
            onChange={(event) => setSelectedGame(event.target.value)}
            aria-label="Filter by game"
            className="w-full appearance-none rounded-xl border border-white/10 bg-black/25 py-2.5 pl-3.5 pr-9 text-sm text-white outline-none transition focus:border-indigo-300/40"
          >
            <option value={ALL_GAMES}>All Games</option>
            {gameOptions.map((game) => (
              <option key={game.id} value={game.id}>
                {game.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {visibleItems.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            News
          </h2>

          <div className="space-y-3">
            {visibleItems.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-zinc-400">
          {isFiltered ? "No matching stories." : "News coming soon."}
        </p>
      )}
    </div>
  );
}
