import { ImproveCard } from "@/components/valorant-improve/ImproveShell";
import type { MatchReviewCard } from "@/lib/valorant-coach/types";

export function MatchReviewPanel({
  matches,
  riotConnected,
}: {
  matches: MatchReviewCard[];
  riotConnected: boolean;
}) {
  return (
    <div className="space-y-4">
      <ImproveCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-semibold text-white">Match Review</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {riotConnected
            ? "Recent competitive games from your connected Riot account."
            : "Connect your Riot account to automatically review your matches."}
        </p>
      </ImproveCard>

      {!riotConnected ? (
        <ImproveCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            Sample matches
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            These are not your games. They show the review layout the Riot feed will use later.
          </p>
        </ImproveCard>
      ) : null}

      <div className="space-y-3">
        {matches.map((match) => (
          <ImproveCard key={match.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">
                {match.map} · {match.agent}
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                  match.result === "win"
                    ? "border-emerald-400/25 text-emerald-200"
                    : "border-rose-400/25 text-rose-200"
                }`}
              >
                {match.result} {match.score ? `· ${match.score}` : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              {match.kda.k}/{match.kda.d}/{match.kda.a}
              {match.acs != null ? ` · ACS ${match.acs}` : ""}
              {match.headshotPercent != null ? ` · HS ${match.headshotPercent}%` : ""}
              {match.damage != null ? ` · ${match.damage} dmg` : ""}
            </p>
            {match.firstKills != null || match.firstDeaths != null ? (
              <p className="mt-1 text-xs text-zinc-500">
                First kills {match.firstKills ?? "—"} · First deaths {match.firstDeaths ?? "—"}
              </p>
            ) : null}
            <ul className="mt-3 space-y-1 text-sm text-zinc-400">
              {match.observations.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </ImproveCard>
        ))}
      </div>
    </div>
  );
}
