"use client";

import { useMemo, useState } from "react";
import type { CharacterSummary } from "@/types/teams";
import { CharacterCard } from "@/components/game-calc/CharacterCard";

export function CharacterSection({
  characters,
  gameSlug,
}: {
  characters: CharacterSummary[];
  gameSlug: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return characters;
    return characters.filter(
      (character) =>
        character.name.toLowerCase().includes(normalized) ||
        character.element.toLowerCase().includes(normalized) ||
        character.role.toLowerCase().includes(normalized),
    );
  }, [characters, query]);

  return (
    <section id="characters" className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">Team builder</p>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Characters</h2>
          <p className="text-sm text-zinc-400">Browse roster and open team calculations per character.</p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search characters</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, element, role…"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/40 focus:outline-none focus:ring-1 focus:ring-indigo-400/30"
          />
        </label>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((character) => (
            <CharacterCard key={character.id} character={character} gameSlug={gameSlug} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
          No characters match your search.
        </p>
      )}
    </section>
  );
}
