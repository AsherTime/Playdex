"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SignupView = "form" | "check-email" | "setup-ready";

export function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [view, setView] = useState<SignupView>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login?next=${encodeURIComponent("/profile/setup")}`
              : undefined,
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        // Email confirmation disabled in Supabase — continue to profile setup.
        setView("setup-ready");
        return;
      }

      setView("check-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login?next=${encodeURIComponent("/profile/setup")}`
              : undefined,
        },
      });
      if (resendError) throw resendError;
      setMessage("Confirmation email resent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setResending(false);
    }
  };

  if (view === "check-email") {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Confirm your email</p>
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="text-sm leading-6 text-zinc-400">
            We sent a confirmation link to{" "}
            <span className="font-medium text-zinc-200">{email.trim()}</span>. Click the link to
            confirm your account, then log in to finish your profile.
          </p>
        </div>

        {message ? (
          <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/login?next=${encodeURIComponent("/profile/setup")}`}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25"
          >
            Go to login
          </Link>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || !email.trim()}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {resending ? "Resending…" : "Resend confirmation email"}
          </button>
        </div>
      </div>
    );
  }

  if (view === "setup-ready") {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Account created</p>
          <h2 className="text-xl font-semibold text-white">You&apos;re signed in</h2>
          <p className="text-sm leading-6 text-zinc-400">
            Your account is ready. Finish your profile to personalize your feed.
          </p>
        </div>
        <Link
          href="/profile/setup"
          className="inline-flex w-full items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25"
        >
          Continue to profile setup
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-indigo-400/40 focus:outline-none"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-indigo-300 hover:text-indigo-200"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
