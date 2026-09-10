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
    if (!open || details || loading) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(`/api/guides/equipment/${canonical.kind}/${canonical.id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load equipment details.");
        return (await response.json()) as GuideEquipmentDetails;
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
  }, [canonical.id, canonical.kind, details, loading, open]);

  return (
    <details
      className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-zinc-400"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-zinc-300">
        {canonical.kind === "set" ? "Set bonuses" : "Stats & passive"}
      </summary>
      <div className="mt-2 space-y-3">
        {loading ? <p>Loading…</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
        {details?.kind === "equipment" ? (
          <>
            {details.stats.length ? (
              <div className="space-y-1.5">
                <p className="font-medium text-zinc-300">Stats</p>
                {details.stats.map((stat) => (
                  <div key={stat.key} className="flex items-start justify-between gap-3">
                    <span>{stat.name}</span>
                    <span className="text-right text-zinc-200">
                      {stat.levelOne ?? "—"}
                      {stat.maxValue ? ` → ${stat.maxValue}` : ""}
                      {stat.maxLevel ? ` (Lv${stat.maxLevel})` : ""}
                    </span>
                  </div>
                ))}
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
