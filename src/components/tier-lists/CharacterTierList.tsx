import Image from "next/image";
import Link from "next/link";
import type { TierListData } from "@/lib/tier-lists/types";

const colors = ["text-rose-200 bg-rose-400/15", "text-amber-200 bg-amber-400/15",
  "text-yellow-200 bg-yellow-400/15", "text-lime-200 bg-lime-400/15",
  "text-emerald-200 bg-emerald-400/15", "text-cyan-200 bg-cyan-400/15",
  "text-sky-200 bg-sky-400/15", "text-zinc-200 bg-zinc-400/15"];

export function CharacterTierList({ data }: { data: TierListData }) {
  const characters = new Map(data.characters.map(character => [character.id, character]));
  return <div className="min-w-0 divide-y divide-white/10 border-y border-white/10">
    {data.list.tiers.map((tier, tierIndex) => (
      <section key={tier} aria-label={`${tier} tier`} className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] sm:grid-cols-[60px_minmax(0,1fr)]">
        <h2 className={`flex items-center justify-center text-base font-bold sm:text-xl ${colors[tierIndex % colors.length]}`}>{tier}</h2>
        <div className="grid min-w-0 divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {data.list.roles.map(role => {
            const entries = data.entries.filter(e => e.tier === tier && e.role === role).sort((a,b) => a.sort_order-b.sort_order);
            return <div key={role} className="min-w-0 p-3">
              <h3 className="mb-3 text-xs font-medium text-zinc-400">{role}</h3>
              {entries.length ? <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-x-2 gap-y-3">
                {entries.map(entry => {
                  const character = characters.get(entry.character_id);
                  if (!character) return null;
                  return <Link key={character.id} href={`/games/${data.list.game_id}/characters/${character.slug}`}
                    title={character.name} data-tier-character={character.id}
                    className="group flex min-w-0 flex-col items-center gap-1 rounded-md text-center focus-visible:outline-2 focus-visible:outline-cyan-300">
                    <div className="relative h-14 w-14 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10 transition group-hover:ring-cyan-300/60">
                      {character.icon ? <Image src={character.icon} alt="" fill sizes="56px" className="object-contain" /> : null}
                    </div>
                    <span className="w-full break-words text-[11px] leading-4 text-zinc-200 group-hover:text-white">{character.name}</span>
                  </Link>;
                })}
              </div> : <p className="text-xs text-zinc-600">No characters</p>}
            </div>;
          })}
        </div>
      </section>
    ))}
  </div>;
}
