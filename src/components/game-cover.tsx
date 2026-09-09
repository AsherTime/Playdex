"use client";

import Image from "next/image";
import { useState } from "react";
import { getGameCoverAsset } from "@/data/game-covers";
import type { Game } from "@/types/gamedex";

export function GameCover({ game }: { game: Pick<Game, "slug" | "title" | "coverTone"> }) {
  const cover = getGameCoverAsset(game.slug);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(cover) && !coverFailed;

  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${game.coverTone} p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]`}
    >
      {cover && !coverFailed ? (
        <>
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
            style={{ objectPosition: cover.objectPosition }}
            onError={() => setCoverFailed(true)}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        </>
      ) : null}

      <div
        className={`relative rounded-full px-3 py-1 text-xs font-medium text-white/90 backdrop-blur ${
          showCover ? "bg-black/45" : "bg-black/25"
        }`}
      >
        {game.title}
      </div>
    </div>
  );
}
