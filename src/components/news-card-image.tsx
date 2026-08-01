"use client";

import { resolveNewsImageUrl } from "@/lib/news-images";

export function NewsCardImage({
  imageUrl,
  gameId,
}: {
  imageUrl?: string;
  gameId?: string;
}) {
  const initialSrc = resolveNewsImageUrl(imageUrl, gameId);
  const isRemoteImage = initialSrc.startsWith("http");

  return (
    <div className="relative w-40 shrink-0 self-stretch overflow-hidden bg-zinc-950 sm:w-52 md:w-60 lg:w-72">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={initialSrc}
        alt=""
        loading="lazy"
        className={`absolute inset-0 h-full w-full transition duration-500 ease-out group-hover:scale-[1.04] ${
          isRemoteImage ? "object-cover" : "object-contain p-5 sm:p-7"
        }`}
        onError={(event) => {
          const target = event.currentTarget;
          const fallback = resolveNewsImageUrl(null, gameId);
          if (target.src !== fallback) {
            target.src = fallback;
          }
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent" />
      {!isRemoteImage ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
      ) : null}
    </div>
  );
}
