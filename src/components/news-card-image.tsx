"use client";

import { useState } from "react";
import { hasFeedThumbnail } from "@/lib/news-images";

export function NewsCardImage({
  imageUrl,
}: {
  imageUrl?: string;
  gameId?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!hasFeedThumbnail(imageUrl) || failed) {
    return null;
  }

  return (
    <div className="relative w-40 shrink-0 self-stretch overflow-hidden bg-zinc-950 sm:w-52 md:w-60 lg:w-72">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent" />
    </div>
  );
}
