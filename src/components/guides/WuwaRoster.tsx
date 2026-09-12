"use client";
import Link from "next/link";
import { useState } from "react";

type Character = { id: string; slug: string; display_name: string; element: string | null; weapon_type: string | null; portrait_url: string | null };
export function WuwaRoster({ characters }: { characters: Character[] }) {
  const [query, setQuery] = useState("");
  return <section className="space-y-4">
    <input type="search" aria-label="Search characters" placeholder="Search characters" value={query} onChange={e => setQuery(e.target.value)}
      className="w-full rounded-md border border-white/15 bg-white/5 p-2 text-sm sm:max-w-xs" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {characters.filter(c => c.display_name.toLowerCase().includes(query.trim().toLowerCase())).map(c => <Link key={c.id} href={`/games/wuthering-waves/characters/${c.slug}`}
        className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-teal-300/50">
        {c.portrait_url && <img src={c.portrait_url} alt="" className="h-14 w-14 shrink-0 object-contain" loading="lazy" />}
        <div className="min-w-0"><h2 className="break-words text-sm font-semibold text-white">{c.display_name}</h2><p className="mt-1 text-xs text-zinc-400">{c.element}</p></div>
      </Link>)}
    </div>
  </section>;
}
