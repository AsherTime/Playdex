import Image from "next/image";
import Link from "next/link";
import { GuideTabs } from "@/components/guides/GuideTabs";
import { GuideMetaChip } from "@/components/guides/guide-surfaces";
import { MissingAssetIcon } from "@/components/guides/MissingAssetIcon";
import { getElementStyle } from "@/lib/character-elements";
import type { GuideCharacterDetail } from "@/lib/guides/genshin";

export function CharacterGuidePage({
  character,
  gameSlug,
  canEdit = false,
}: {
  character: GuideCharacterDetail;
  gameSlug: string;
  canEdit?: boolean;
}) {
  const elementStyle = getElementStyle(character.element);
  const stars = character.rarity ? "★".repeat(character.rarity) : null;

  return (
    <div className="guide-page space-y-6">
      <nav className="text-sm text-zinc-500">
        <Link href={`/games/${gameSlug}`} className="transition hover:text-white">
          Genshin Impact
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link href={`/games/${gameSlug}#characters`} className="transition hover:text-white">
          Characters
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-300">{character.name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-3xl bg-white/[0.035] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_24px_60px_-32px_rgba(0,0,0,0.75)]">
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${elementStyle.bg} opacity-35`}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.12),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070811] via-[#070811]/55 to-transparent" />

        <div className="relative flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-end sm:gap-7 sm:px-7 sm:py-8">
          <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0 sm:h-48 sm:w-48 lg:h-56 lg:w-56">
            <div className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-br ${elementStyle.bg} blur-2xl`} />
            <div className="relative h-full overflow-hidden rounded-[1.35rem] bg-black/20 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
              {character.iconPath ? (
                <Image
                  src={character.iconPath}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 144px, 224px"
                  className="object-cover object-top"
                  priority
                />
              ) : (
                <MissingAssetIcon label={character.name} />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <GuideMetaChip tone="accent">
                <span className={elementStyle.text}>{character.element}</span>
              </GuideMetaChip>
              {character.weaponType ? <GuideMetaChip>{character.weaponType}</GuideMetaChip> : null}
              {character.role ? <GuideMetaChip>{character.role}</GuideMetaChip> : null}
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {character.name}
            </h1>
            {stars ? (
              <p className="mt-2 text-sm tracking-[0.28em] text-amber-200/85" aria-label={`${character.rarity}-star`}>
                {stars}
              </p>
            ) : null}

            {!character.hasBuild || !character.hasTeams ? (
              <p className="mt-3 text-sm text-zinc-400">
                {!character.hasBuild && !character.hasTeams
                  ? "Build and team guide unavailable."
                  : !character.hasBuild
                    ? "Build guide unavailable."
                    : "Team guide unavailable."}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {canEdit ? (
                <Link
                  href={`/games/${gameSlug}/characters/${character.slug}/edit`}
                  className="inline-flex rounded-full bg-cyan-300/12 px-3.5 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/18"
                >
                  Edit Guide
                </Link>
              ) : null}
              <Link
                href={`/games/${gameSlug}#characters`}
                className="text-sm text-zinc-500 transition hover:text-zinc-200"
              >
                All characters
              </Link>
            </div>
          </div>
        </div>
      </section>

      <GuideTabs character={character} />
    </div>
  );
}
