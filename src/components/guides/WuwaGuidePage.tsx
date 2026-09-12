import Link from "next/link";
import { getWuwaCharacters } from "@/lib/guides/wuwa";
import { WuwaRoster } from "./WuwaRoster";

export async function WuwaGuidePage() {
  const characters = await getWuwaCharacters();
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-5">
      <div><p className="text-xs text-teal-300">Wuthering Waves</p><h1 className="mt-1 text-2xl font-semibold text-white">Character Guides</h1></div>
      <Link className="text-sm text-zinc-400 hover:text-white" href="/games">All games</Link>
    </header>
    <WuwaRoster characters={characters} />
  </div>;
}
