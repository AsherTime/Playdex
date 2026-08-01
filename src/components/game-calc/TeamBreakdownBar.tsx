"use client";

import { useState } from "react";
import { getCharacterInitials, getElementBarColors } from "@/lib/character-elements";
import type { MockDamageSource } from "@/data/mock-character-teams";
import type { CalcGameId } from "@/types/teams";

const WUWA_BAR_AREA_HEIGHT = 156;
const GENSHIN_BAR_AREA_HEIGHT = 200;
const WUWA_BAR_SCALE = 0.82;

function CircleImage({
  src,
  alt,
  fallbackLabel,
  accentColor,
  className,
  contain = false,
}: {
  src: string;
  alt: string;
  fallbackLabel: string;
  accentColor: string;
  className: string;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 text-[10px] font-bold ${className}`}
        style={{ color: accentColor }}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} ${contain ? "object-contain p-1" : "object-cover object-top"}`}
      onError={() => setFailed(true)}
    />
  );
}

export function TeamBreakdownBar({
  source,
  maxShare,
  gameId,
}: {
  source: MockDamageSource;
  maxShare: number;
  gameId: CalcGameId;
}) {
  const isWuWa = gameId === "wuthering-waves";
  const colors = getElementBarColors(source.element);
  const barAreaHeight = isWuWa ? WUWA_BAR_AREA_HEIGHT : GENSHIN_BAR_AREA_HEIGHT;
  const scaledShare = maxShare > 0 ? source.share / maxShare : 0;
  const barHeightPercent = isWuWa
    ? Math.max(scaledShare * 100 * WUWA_BAR_SCALE, 6)
    : Math.max(source.share, 2);
  const barHeightPx = (barHeightPercent / 100) * barAreaHeight;
  const weaponSize = isWuWa ? 56 : 48;
  const weaponRadius = weaponSize / 2;
  const minWeaponBottom = 12;
  const maxWeaponBottom = barAreaHeight - weaponSize - 8;
  const weaponBottom = isWuWa
    ? Math.min(Math.max(barHeightPx - weaponRadius, minWeaponBottom), maxWeaponBottom)
    : Math.max(Math.max(source.share, 5), 18);
  const portraitSize = isWuWa ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-16 sm:w-16";
  const barWidth = isWuWa ? "w-12 sm:w-14" : "w-10 sm:w-12";
  const initials = getCharacterInitials(source.name);

  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center justify-end"
      style={isWuWa ? { minWidth: 88 } : undefined}
    >
      <span
        className="mb-1 text-lg font-black tabular-nums sm:text-xl"
        style={{ color: colors.accent }}
      >
        {source.share}%
      </span>

      <div
        className="relative flex w-full flex-col items-center justify-end"
        style={{ height: barAreaHeight }}
      >
        <div
          className="absolute z-20 overflow-hidden rounded-full border-2 shadow-lg"
          style={{
            width: weaponSize,
            height: weaponSize,
            borderColor: colors.accent,
            bottom: isWuWa ? `${weaponBottom}px` : `calc(${weaponBottom}% - ${weaponRadius}px)`,
            backgroundColor: "#0f172a",
          }}
        >
          <CircleImage
            src={source.weaponPath}
            alt={source.weaponName}
            fallbackLabel="?"
            accentColor={colors.accent}
            className="h-full w-full"
            contain
          />
        </div>

        <div
          className={`${barWidth} rounded-t-md transition-[height] duration-700 ease-out`}
          style={{
            height: `${barHeightPercent}%`,
            backgroundColor: colors.primary,
            boxShadow: `0 0 20px ${colors.accent}44`,
          }}
        >
          <div className="h-full bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      </div>

      <div className="relative mt-2 sm:mt-3">
        <div
          className={`${portraitSize} overflow-hidden rounded-full border-2 shadow-xl`}
          style={{ borderColor: colors.accent, backgroundColor: "#1e293b" }}
        >
          <CircleImage
            src={source.isExtraSource ? source.portraitPath : source.portraitPath}
            alt={source.name}
            fallbackLabel={initials}
            accentColor={colors.accent}
            className="h-full w-full"
            contain={source.isExtraSource}
          />
        </div>
        <div
          className="absolute inset-0 -z-10 rounded-full opacity-50 blur-md"
          style={{ backgroundColor: colors.accent }}
        />
      </div>

      <div className="mt-2 min-h-[40px] max-w-[6.5rem] text-center sm:max-w-[7rem]">
        <p className="text-xs font-black leading-tight text-white sm:text-sm">{source.name}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[11px]">
          {source.role}
        </p>
      </div>
    </div>
  );
}
