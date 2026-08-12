import Image from "next/image";
import Link from "next/link";
import { FOLLOWABLE_GAMES } from "@/data/followable-games";
import { getGameDisplayIcon } from "@/data/android-tracked-games";
import { formatPlaytimeSeconds } from "@/lib/game-usage/format";
import type { PublicGamingProfile } from "@/lib/public-profile";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { GamingSummaryShareCard } from "@/components/profile/GamingSummaryShareCard";

function gameTitle(slug: string) {
  return FOLLOWABLE_GAMES.find((g) => g.slug === slug)?.title ?? slug;
}

export function PublicGamingProfileView({
  profile,
}: {
  profile: PublicGamingProfile;
}) {
  if (profile.private) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">This Gamedex profile is private.</h1>
        <p className="mt-2 text-sm text-zinc-400">
          @{profile.username} has not made their gaming profile public.
        </p>
      </div>
    );
  }

  const displayName = profile.displayName ?? profile.username ?? "Gamer";
  const weekSeconds = profile.stats?.weekTotalSeconds ?? 0;
  const topGames =
    profile.recentGames?.map((game) => ({
      gameSlug: game.gameSlug,
      name: gameTitle(game.gameSlug),
      seconds: game.totalPlaytimeSeconds,
      time: formatPlaytimeSeconds(game.totalPlaytimeSeconds),
    })) ?? [];

  const focusLine = profile.improvement
    ? `Improve ${profile.improvement.gameName} — ${profile.improvement.focusAreas.slice(0, 2).join(", ")}`
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.18),transparent_40%)]" />
        <div className="relative flex flex-wrap items-start gap-5">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-indigo-200">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
              Gamedex Profile
            </p>
            <h1 className="text-3xl font-semibold text-white">{displayName}</h1>
            <p className="text-sm text-zinc-500">@{profile.username}</p>
            {profile.bio ? (
              <p className="max-w-xl text-sm leading-7 text-zinc-300">{profile.bio}</p>
            ) : null}
            {profile.joinedAt ? (
              <p className="text-xs text-zinc-600">
                Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.isOwner ? (
              <Link
                href="/profile"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300"
              >
                Edit Profile
              </Link>
            ) : null}
            {profile.username ? (
              <ShareProfileButton username={profile.username} displayName={displayName} />
            ) : null}
          </div>
        </div>
      </section>

      {(profile.stats?.weekTotalSeconds != null && profile.privacy?.showWeeklyPlaytime) ||
      profile.isOwner ? (
        <section className="grid gap-2 sm:grid-cols-3">
          {[
            {
              label: "This week",
              value: formatPlaytimeSeconds(profile.stats?.weekTotalSeconds ?? 0),
              show: profile.privacy?.showWeeklyPlaytime || profile.isOwner,
            },
            {
              label: "This month",
              value: formatPlaytimeSeconds(profile.stats?.monthTotalSeconds ?? 0),
              show: profile.privacy?.showPlaytime || profile.isOwner,
            },
            {
              label: "Active days",
              value: String(profile.stats?.activeDays ?? 0),
              show: profile.privacy?.showStreak || profile.isOwner,
            },
          ]
            .filter((item) => item.show)
            .map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-4"
              >
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</p>
                <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
        </section>
      ) : null}

      {(profile.recentGames?.length ?? 0) > 0 &&
      (profile.privacy?.showRecentGames || profile.isOwner) ? (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Gaming History</h2>
          <ul className="space-y-2">
            {profile.recentGames?.map((game) => {
              const icon = getGameDisplayIcon(game.gameSlug) ?? "/game-fallbacks/default.svg";
              return (
                <li
                  key={game.gameSlug}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                    <Image src={icon} alt="" width={40} height={40} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{gameTitle(game.gameSlug)}</p>
                    <p className="text-xs text-zinc-500">Last 7 days</p>
                  </div>
                  <p className="text-sm font-semibold text-indigo-100">
                    {formatPlaytimeSeconds(game.totalPlaytimeSeconds)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {(profile.favoriteGames?.length ?? 0) > 0 &&
      (profile.privacy?.showFavoriteGames || profile.isOwner) ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Favorite Games</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.favoriteGames?.map((slug) => (
              <span
                key={slug}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-zinc-300"
              >
                {gameTitle(slug)}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {profile.improvement && (profile.privacy?.showImprovementPlan || profile.isOwner) ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Currently Improving</h2>
          <p className="mt-1 text-sm text-zinc-400">{profile.improvement.gameName}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Focus</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.improvement.focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100"
              >
                {area}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-300">
            Today&apos;s progress: {profile.improvement.completedTasks} /{" "}
            {profile.improvement.totalTasks} tasks complete
          </p>
        </section>
      ) : null}

      {profile.username && topGames.length > 0 ? (
        <section className="space-y-4">
          <GamingSummaryShareCard
            displayName={displayName}
            username={profile.username}
            weekTotalSeconds={weekSeconds}
            gamesPlayed={topGames.length}
            topGames={topGames}
            focusLine={focusLine}
          />
          {profile.isOwner ? (
            <ShareProfileButton
              username={profile.username}
              displayName={displayName}
              variant="summary"
              weekTotalSeconds={weekSeconds}
              gamesPlayed={topGames.length}
              topGames={topGames.map((g) => ({ name: g.name, time: g.time }))}
              focusLine={focusLine}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
