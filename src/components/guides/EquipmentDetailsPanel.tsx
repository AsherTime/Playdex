"use client";

import { useEffect, useState } from "react";
import type { GuideEquipmentDetails } from "@/lib/guides/equipment-types";
import type { GuideEquipmentSummary } from "@/lib/guides/equipment-types";

export function EquipmentDetailsPanel({
  canonical,
}: {
  canonical: GuideEquipmentSummary;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<GuideEquipmentDetails | null>(null);

  useEffect(() => {
    // Do not put `loading` in deps: setLoading(true) would cleanup and mark the
    // in-flight request cancelled, so finally never clears loading.
    if (!open || details) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(`/api/guides/equipment/${canonical.kind}/${canonical.id}`)
      .then(async (response) => {
        const payload = (await response.json()) as GuideEquipmentDetails & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Could not load equipment details.",
          );
        }
        return payload;
      })
      .then((payload) => {
        if (!cancelled) setDetails(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load equipment details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canonical.id, canonical.kind, details, open]);

  return (
    <details
      className="mt-2 text-sm leading-6 text-zinc-400"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-zinc-300 transition hover:text-white">
        {canonical.kind === "set" ? "Set bonuses" : "Stats & passive"}
      </summary>
      <div className="mt-2 space-y-3">
        {loading ? <p>Loading…</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        {details?.kind === "equipment" ? (
          <>
            {details.stats.length ? (
              <div className="space-y-1.5">
                <p className="font-medium text-zinc-300">
                  Level {details.stats.find((stat) => stat.maxLevel != null)?.maxLevel ?? 90}
                </p>
                {details.stats.map((stat) => {
                  const value = formatWeaponStatValue(stat.key, stat.maxValue);
                  if (!value) return null;
                  return (
                    <div key={stat.key} className="flex items-start justify-between gap-3">
                      <span>{formatWeaponStatLabel(stat.key, stat.name)}</span>
                      <span className="text-right text-zinc-200">{value}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {details.effects.length ? (
              <div className="space-y-2">
                <p className="font-medium text-zinc-300">Passive</p>
                {details.effects.map((effect) => (
                  <div key={`${effect.rank}-${effect.name ?? "effect"}`}>
                    <p className="text-zinc-300">
                      R{effect.rank}
                      {effect.name ? ` · ${effect.name}` : ""}
                    </p>
                    {effect.description ? (
                      <p className="mt-1 whitespace-pre-line">{effect.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        {details?.kind === "set" ? (
          <div className="space-y-2">
            {details.bonuses.map((bonus) => (
              <div key={`${bonus.piecesRequired}-${bonus.description ?? "bonus"}`}>
                <p className="font-medium text-zinc-300">{bonus.piecesRequired}-Piece</p>
                {bonus.description ? (
                  <p className="mt-1 whitespace-pre-line">{bonus.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function formatWeaponStatLabel(key: string, fallbackName: string) {
  if (key === "base_attack" || fallbackName === "ATK") return "Base ATK";
  return fallbackName;
}

/** In-game style: integer ATK, percentages to at most one decimal. */
function formatWeaponStatValue(key: string, raw: string | null) {
  if (!raw) return null;
  const percent = raw.includes("%");
  const numeric = Number.parseFloat(raw.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return raw;

  if (key === "base_attack" || (!percent && key.includes("attack"))) {
    return String(Math.round(numeric));
  }

  if (percent) {
    const rounded = Math.round(numeric * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${text}%`;
  }

  return String(Math.round(numeric));
}
