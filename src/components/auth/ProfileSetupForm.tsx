"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { FOLLOWABLE_GAMES } from "@/data/followable-games";
import {
  getFollowedGameSlugs,
  getOwnProfile,
  setFollowedGames,
  upsertOwnProfile,
} from "@/lib/auth-profile";

export function ProfileSetupForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [followed, setFollowed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const timer = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;

    void (async () => {
      try {
        const [profile, slugs] = await Promise.all([
          getOwnProfile(),
          getFollowedGameSlugs(),
        ]);
        if (cancelled) return;
        setName(profile?.name ?? "");
        setAge(profile?.age != null ? String(profile.age) : "");
        setFollowed(slugs);
      } catch {
        // Fresh accounts may not have a readable profile row yet.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const toggleGame = (slug: string) => {
    setFollowed((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");

    try {
      const parsedAge = age ? Number(age) : null;
      if (parsedAge !== null && (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
        throw new Error("Enter a valid age between 1 and 120.");
      }
      if (!name.trim()) throw new Error("Name is required.");
      if (!followed.length) throw new Error("Select at least one game to follow.");

      await upsertOwnProfile({
        name: name.trim(),
        age: parsedAge,
        email: user.email ?? "",
      });
      await setFollowedGames(followed);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !ready) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
          Profile setup
        </p>
        <h1 className="text-2xl font-semibold text-white">Please log in first</h1>
        <p className="text-sm leading-6 text-zinc-400">
          Please log in first to finish your profile. Confirm your email if you haven&apos;t yet,
          then sign in with your account.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?next=/profile/setup"
            className="inline-flex rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25"
          >
            Go to login
          </Link>
          <Link
            href="/signup"
            className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Back to signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
          Finish setup
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Complete your profile</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as {user.email}. Add your name, age, and games you follow.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
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

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Games you follow
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
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}
