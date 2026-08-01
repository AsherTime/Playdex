import Link from "next/link";
import type { CharacterSummary } from "@/types/teams";
import { CharacterPortrait } from "@/components/game-calc/CharacterPortrait";
import { getElementStyle } from "@/lib/character-elements";
import { getCalcGameTitle } from "@/lib/team-games";

export function CharacterHero({
  character,
  gameSlug,
  teamBreadcrumb,
}: {
  character: CharacterSummary;
  gameSlug: string;
  teamBreadcrumb?: string;
}) {
  const elementStyle = getElementStyle(character.element);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div
        className={`relative h-28 bg-gradient-to-br sm:h-36 ${elementStyle.bg} opacity-90`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070811] via-[#070811]/60 to-transparent" />
      </div>

      <div className="relative px-4 pb-6 sm:px-6">
        <nav className="mb-4 pt-2 text-sm text-zinc-500">
          <Link href={`/games/${gameSlug}`} className="transition hover:text-white">
            {getCalcGameTitle(character.gameId)}
          </Link>
          <span className="mx-2 text-zinc-600">/</span>
          <Link href={`/games/${gameSlug}#characters`} className="transition hover:text-white">
            Characters
          </Link>
          <span className="mx-2 text-zinc-600">/</span>
          {teamBreadcrumb ? (
            <Link
              href={`/games/${gameSlug}/characters/${character.slug}`}
              className="transition hover:text-white"
            >
              {character.name}
            </Link>
          ) : (
            <span className="text-zinc-300">{character.name}</span>
          )}
          {teamBreadcrumb ? (
            <>
              <span className="mx-2 text-zinc-600">/</span>
              <span className="text-zinc-300">{teamBreadcrumb}</span>
            </>
          ) : null}
        </nav>

        <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          <div className="shrink-0">
            <CharacterPortrait
              name={character.name}
              element={character.element}
              portraitPath={character.portraitPath}
              className="aspect-[3/4] w-[140px] rounded-2xl border-2 border-[#070811] shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:w-[168px]"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3 pb-1">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-md bg-gradient-to-r px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${elementStyle.bg} ${elementStyle.text}`}
              >
                {character.element}
              </span>
              <span className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {character.role}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {character.name}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-[15px]">
              {character.summary}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
