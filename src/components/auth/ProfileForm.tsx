"use client";

import { Suspense } from "react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { DeviceGameActivity } from "@/components/profile/DeviceGameActivity";
import { DeviceTrackerDebugPanel } from "@/components/profile/DeviceTrackerDebugPanel";
import { GamingSummaryShareCard } from "@/components/profile/GamingSummaryShareCard";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { FOLLOWABLE_GAMES } from "@/data/followable-games";
import {
  getFollowedGameSlugs,
  getOwnProfile,
  setFollowedGames,
  upsertOwnProfile,
} from "@/lib/auth-profile";
import { buildImprovementSnapshotFromLocal } from "@/lib/improvement-snapshot";
import { profilePath, validateUsername } from "@/lib/username";

export function ProfileForm() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [age, setAge] = useState("");
  const [followed, setFollowed] = useState<string[]>([]);
  const [mainGameSlug, setMainGameSlug] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("private");
  const [showPlaytime, setShowPlaytime] = useState(false);
  const [showWeeklyPlaytime, setShowWeeklyPlaytime] = useState(false);
  const [showRecentGames, setShowRecentGames] = useState(false);
  const [showImprovementPlan, setShowImprovementPlan] = useState(false);
  const [showFavoriteGames, setShowFavoriteGames] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showPlatform, setShowPlatform] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/profile");
      return;
    }

    void (async () => {
      try {
        const [profile, slugs] = await Promise.all([
          getOwnProfile(),
          getFollowedGameSlugs(),
        ]);
        setName(profile?.name ?? "");
        setUsername(profile?.username ?? "");
        setBio(profile?.bio ?? "");
        setAvatarUrl(profile?.avatar_url ?? "");
        setAge(profile?.age != null ? String(profile.age) : "");
        setFollowed(slugs);
        setMainGameSlug(profile?.main_game_slug ?? "");
        setProfileVisibility(profile?.profile_visibility ?? "private");
        setShowPlaytime(profile?.show_playtime ?? false);
        setShowWeeklyPlaytime(profile?.show_weekly_playtime ?? false);
        setShowRecentGames(profile?.show_recent_games ?? false);
        setShowImprovementPlan(profile?.show_improvement_plan ?? false);
        setShowFavoriteGames(profile?.show_favorite_games ?? false);
        setShowStreak(profile?.show_streak ?? false);
        setShowPlatform(profile?.show_platform ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setReady(true);
      }
    })();
  }, [authLoading, user, router]);

  const toggleGame = (slug: string) => {
    setFollowed((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const parsedAge = age ? Number(age) : null;
      if (parsedAge !== null && (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
        throw new Error("Enter a valid age between 1 and 120.");
      }
      if (username.trim()) {
        const usernameError = validateUsername(username);
        if (usernameError) throw new Error(usernameError);
      }

      const improvementSnapshot = buildImprovementSnapshotFromLocal();

      await upsertOwnProfile({
        name: name.trim(),
        age: parsedAge,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        mainGameSlug: mainGameSlug || null,
        profileVisibility,
        showPlaytime,
        showWeeklyPlaytime,
        showRecentGames,
        showImprovementPlan,
        showFavoriteGames,
        showStreak,
        showPlatform,
        improvementSnapshot,
      });
      await setFollowedGames(followed);
      setMessage("Profile saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
        Loading profile…
      </div>
    );
  }

  const improvementSnapshot = buildImprovementSnapshotFromLocal();

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
          Gaming Identity
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Your Gamedex profile</h1>
        <p className="mt-2 text-sm text-zinc-400">{user?.email}</p>
        {username ? (
          <Link
            href={profilePath(username)}
            className="mt-2 inline-block text-sm text-indigo-300 hover:text-indigo-200"
          >
            {profilePath(username)}
          </Link>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Display name
          </span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Username
          </span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            placeholder="yourname"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
          />
          <p className="text-xs text-zinc-600">3–24 chars, lowercase letters, numbers, underscores.</p>
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bio</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={3}
            maxLength={160}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Avatar URL
          </span>
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Age</span>
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(event) => setAge(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Main game
          </span>
          <select
            value={mainGameSlug}
            onChange={(event) => setMainGameSlug(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
          >
            <option value="">None</option>
            {FOLLOWABLE_GAMES.map((game) => (
              <option key={game.slug} value={game.slug}>
                {game.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Privacy & public profile
        </p>
        <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
          <span>Profile visibility</span>
          <select
            value={profileVisibility}
            onChange={(event) =>
              setProfileVisibility(event.target.value as "public" | "private")
            }
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        {(
          [
            { label: "Show total playtime", value: showPlaytime, onChange: setShowPlaytime },
            { label: "Show weekly playtime", value: showWeeklyPlaytime, onChange: setShowWeeklyPlaytime },
            { label: "Show individual games", value: showRecentGames, onChange: setShowRecentGames },
            { label: "Show improvement plan", value: showImprovementPlan, onChange: setShowImprovementPlan },
            { label: "Show favorite games", value: showFavoriteGames, onChange: setShowFavoriteGames },
            { label: "Show gaming streak / active days", value: showStreak, onChange: setShowStreak },
            { label: "Show platform info", value: showPlatform, onChange: setShowPlatform },
          ] as const
        ).map((item) => (
          <label key={item.label} className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={item.value}
              onChange={(event) => item.onChange(event.target.checked)}
              className="rounded border-white/20"
            />
            {item.label}
          </label>
        ))}
        <p className="text-xs text-zinc-600">
          Public stats stay off until you enable them. Tracking on Android does not automatically
          publish your activity.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Favorite games
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FOLLOWABLE_GAMES.map((game) => {
            const selected = followed.includes(game.slug);
            return (
              <button
                key={game.slug}
                type="button"
                onClick={() => toggleGame(game.slug)}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                  selected
                    ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-50"
                    : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20"
                }`}
              >
                {game.title}
              </button>
            );
          })}
        </div>
      </div>

      {username ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Share</p>
          <ShareProfileButton username={username} displayName={name || username} />
          {improvementSnapshot ? (
            <GamingSummaryShareCard
              displayName={name || username}
              username={username}
              weekTotalSeconds={0}
              gamesPlayed={0}
              topGames={[]}
              focusLine={`Improve ${improvementSnapshot.gameName}`}
            />
          ) : null}
        </div>
      ) : null}

      <DeviceGameActivity />
      <Suspense fallback={null}>
        <DeviceTrackerDebugPanel />
      </Suspense>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.replace("/");
            router.refresh();
          }}
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
        >
          Log out
        </button>
        <Link
          href="/improve"
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
        >
          Improvement planner
        </Link>
      </div>
    </form>
  );
}
