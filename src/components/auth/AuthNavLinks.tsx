"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthNavLinks({ compact = false }: { compact?: boolean }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <span className={compact ? "px-3 py-2 text-sm text-zinc-500" : "px-3 py-2 text-sm text-zinc-500"}>
        …
      </span>
    );
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className={
            compact
              ? "whitespace-nowrap rounded-full px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
              : "block rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          }
        >
          Login
        </Link>
        {!compact ? (
          <Link
            href="/signup"
            className="block rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            Sign up
          </Link>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Link
        href="/profile"
        className={
          compact
            ? "whitespace-nowrap rounded-full px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
            : "block rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        }
      >
        Profile
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className={
          compact
            ? "whitespace-nowrap rounded-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/[0.05]"
            : "block w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
        }
      >
        Logout
      </button>
    </>
  );
}
