import Link from "next/link";
import { CharacterGuideBrowser } from "@/components/guides/CharacterGuideBrowser";
import { getGenshinGuideCharacters } from "@/lib/guides/genshin";
import { GenshinNavigation } from "@/components/guides/GenshinNavigation";

export async function GenshinGuidePage() {
  const characters = await getGenshinGuideCharacters();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-300/80">
              Genshin Impact
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Character Guides
            </h1>
          </div>
          <Link
            href="/games"
            className="inline-flex w-fit rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            All games
          </Link>
        </div>
        <GenshinNavigation active="guides" />
      </section>

      <CharacterGuideBrowser characters={characters} gameSlug="genshin-impact" />
    </div>
  );
}
