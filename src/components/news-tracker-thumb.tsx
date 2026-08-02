"use client";

import { useState } from "react";
import { hasFeedThumbnail } from "@/lib/news-images";

export function NewsTrackerThumb({
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
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
