"use client";

import { resolveNewsImageUrl } from "@/lib/news-images";

export function NewsTrackerThumb({
  imageUrl,
  gameId,
}: {
  imageUrl?: string;
  gameId?: string;
}) {
  const initialSrc = resolveNewsImageUrl(imageUrl, gameId);
  const isRemoteImage = initialSrc.startsWith("http");

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={initialSrc}
        alt=""
        loading="lazy"
        className={`h-full w-full ${isRemoteImage ? "object-cover" : "object-contain p-1.5"}`}
        onError={(event) => {
          const target = event.currentTarget;
          const fallback = resolveNewsImageUrl(null, gameId);
          if (target.src !== fallback) {
            target.src = fallback;
          }
        }}
      />
    </div>
  );
}
