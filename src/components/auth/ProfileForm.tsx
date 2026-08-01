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

export function ProfileForm() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [followed, setFollowed] = useState<string[]>([]);
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
        setAge(profile?.age != null ? String(profile.age) : "");
        setFollowed(slugs);
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
      await upsertOwnProfile({ name: name.trim(), age: parsedAge });
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

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-300/80">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Your profile</h1>
        <p className="mt-2 text-sm text-zinc-400">{user?.email}</p>
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
