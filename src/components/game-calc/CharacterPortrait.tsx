"use client";

import { useState } from "react";
import { getCharacterInitials, getElementStyle } from "@/lib/character-elements";

export function CharacterPortrait({
  name,
  element,
  portraitPath,
  className = "",
}: {
  name: string;
  element: string;
  portraitPath: string;
  className?: string;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const style = getElementStyle(element);
  const initials = getCharacterInitials(name);

  if (useFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${style.bg} ring-1 ring-inset ${style.ring} ${className}`}
      >
        <span className={`text-lg font-bold tracking-tight ${style.text}`}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={portraitPath}
        alt=""
        className="h-full w-full object-cover object-top"
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}
