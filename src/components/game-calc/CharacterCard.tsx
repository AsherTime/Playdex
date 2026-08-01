import Link from "next/link";
import type { CharacterSummary } from "@/types/teams";
import { CharacterPortrait } from "@/components/game-calc/CharacterPortrait";
import { getElementStyle } from "@/lib/character-elements";

export function CharacterCard({
  character,
  gameSlug,
}: {
  character: CharacterSummary;
  gameSlug: string;
}) {
  const elementStyle = getElementStyle(character.element);

  return (
    <Link
      href={`/games/${gameSlug}/characters/${character.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <CharacterPortrait
        name={character.name}
        element={character.element}
        portraitPath={character.portraitPath}
        className="aspect-[3/4] w-full"
      />
      <div className="space-y-2 p-3">
        <h3 className="truncate text-sm font-semibold text-white transition group-hover:text-indigo-100">
          {character.name}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-md bg-gradient-to-r px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${elementStyle.bg} ${elementStyle.text}`}
          >
            {character.element}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
            {character.role}
          </span>
        </div>
      </div>
    </Link>
  );
}
