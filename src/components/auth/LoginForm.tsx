"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { checkAuthEmailStatus, normalizeAuthEmail } from "@/lib/auth/email-status";
import { isProfileSetupComplete } from "@/lib/auth-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const linkError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(linkError ?? "");
  const [loading, setLoading] = useState(false);
  const [missingAccount, setMissingAccount] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMissingAccount(false);
    setLoading(true);

    const normalizedEmail = normalizeAuthEmail(email);

    try {
      const account = await checkAuthEmailStatus(normalizedEmail);

      if (account.status === "not_found") {
        setMissingAccount(true);
        setError("No Playdex account uses that email yet. Create an account to get started.");
        return;
      }

      if (account.status === "unconfirmed") {
        setError("That account is not confirmed yet. Check your email before logging in.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setError("That password is not correct. Try again or reset your password.");
        } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("That account is not confirmed yet. Check your email before logging in.");
        } else {
          console.error("Login failed", signInError);
          setError("Could not log in right now. Try again in a minute.");
        }
        return;
      }

      const setupComplete = await isProfileSetupComplete();
      if (!setupComplete) {
        router.replace("/profile/setup");
      } else if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      } else {
        router.replace("/");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/15"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Password
        </span>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/30 focus-within:border-indigo-400/50 focus-within:ring-2 focus-within:ring-indigo-400/15">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="shrink-0 px-3 text-xs font-medium text-zinc-300 hover:text-white"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-indigo-300 hover:text-indigo-200">
          Forgot password?
        </Link>
      </div>

      {error ? (
        <div className="space-y-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          <p>{error}</p>
          {missingAccount ? (
            <Link href="/signup" className="font-medium text-indigo-200 hover:text-indigo-100">
              Create account
            </Link>
          ) : error.includes("password") ? (
            <Link
              href="/forgot-password"
              className="font-medium text-indigo-200 hover:text-indigo-100"
            >
              Reset password
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Log in"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        No account?{" "}
        <Link href="/signup" className="text-indigo-300 hover:text-indigo-200">
          Sign up
        </Link>
      </p>
    </form>
  );
}
