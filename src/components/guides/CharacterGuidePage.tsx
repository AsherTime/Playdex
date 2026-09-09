import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { GuideTabs } from "@/components/guides/GuideTabs";
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

  return (
    <div className="space-y-5">
      <nav className="text-sm text-zinc-500">
        <Link href={`/games/${gameSlug}`} className="transition hover:text-white">
          Genshin Impact
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-300">{character.name}</span>
      </nav>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${elementStyle.bg} ring-1 ${elementStyle.ring}`}
            style={{ width: 80, height: 80 }}
          >
            {character.iconPath ? (
              <Image
                src={character.iconPath}
                alt=""
                fill
                sizes="80px"
                className="object-contain object-bottom p-1"
                priority
              />
            ) : (
              <MissingAssetIcon label={character.name} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <GuidePill className={`${elementStyle.text} bg-white/5`}>{character.element}</GuidePill>
              {character.weaponType ? <GuidePill>{character.weaponType}</GuidePill> : null}
              {character.rarity ? <GuidePill>{character.rarity}-Star</GuidePill> : null}
              {character.role ? <GuidePill>{character.role}</GuidePill> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {character.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {character.hasBuild ? "Build data imported from Icy Veins." : "Build guide data unavailable."}
              {" "}
              {character.hasTeams ? "Team data imported from Icy Veins." : "Team data unavailable."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Link
                href={`/games/${gameSlug}/characters/${character.slug}/edit`}
                className="inline-flex w-fit rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/15"
              >
                Edit Guide
              </Link>
            ) : null}
            <Link
              href={`/games/${gameSlug}#characters`}
              className="inline-flex w-fit rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Back
            </Link>
          </div>
        </div>
      </section>

      <GuideTabs character={character} />
    </div>
  );
}

function GuidePill({
  children,
  className = "bg-white/5 text-zinc-300",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}
