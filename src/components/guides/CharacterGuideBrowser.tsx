import Image from "next/image";
import Link from "next/link";
import { MissingAssetIcon } from "@/components/guides/MissingAssetIcon";
import { getElementStyle } from "@/lib/character-elements";
import type { GuideCharacterCard } from "@/lib/guides/genshin";

export function CharacterGuideBrowser({
  characters,
  gameSlug,
}: {
  characters: GuideCharacterCard[];
  gameSlug: string;
}) {
  return (
    <section id="characters" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Characters</h2>
        </div>
        <span className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-zinc-400">
          {characters.length} characters
        </span>
      </div>

      {characters.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {characters.map((character) => (
            <CharacterGuideCard key={character.id} character={character} gameSlug={gameSlug} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
          Guide data unavailable.
        </p>
      )}
    </section>
  );
}

function CharacterGuideCard({
  character,
  gameSlug,
}: {
  character: GuideCharacterCard;
  gameSlug: string;
}) {
  const elementStyle = getElementStyle(character.element);

  return (
    <Link
      href={`/games/${gameSlug}/characters/${character.slug}`}
      className="group flex min-h-[76px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-2.5 transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div
        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${elementStyle.bg} ring-1 ${elementStyle.ring}`}
        style={{ width: 56, height: 56 }}
      >
        {character.iconPath ? (
          <Image
            src={character.iconPath}
            alt=""
            fill
            sizes="56px"
            className="object-contain object-bottom p-1"
          />
        ) : (
          <MissingAssetIcon label={character.name} />
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-white group-hover:text-indigo-100">
          {character.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {character.element} · {character.role ?? "Role unavailable"}
        </p>
        <div className="mt-1.5 flex gap-1">
          <GuideDataDot active={character.hasKit} label="Kit" />
          <GuideDataDot active={character.hasBuild} label="Build" />
          <GuideDataDot active={character.hasTeams} label="Teams" />
        </div>
      </div>
    </Link>
  );
}

function GuideDataDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
        active ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-zinc-500"
      }`}
    >
      {label}
    </span>
  );
}
