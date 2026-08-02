"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { checkAuthEmailStatus, normalizeAuthEmail } from "@/lib/auth/email-status";
import { isWeakPassword } from "@/lib/auth/password";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SignupView = "form" | "check-email" | "setup-ready" | "existing-confirmed";

function profileSetupRedirect() {
  if (typeof window === "undefined") return undefined;
  const next = encodeURIComponent("/profile/setup");
  return `${window.location.origin}/auth/callback?next=${next}`;
}

export function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [view, setView] = useState<SignupView>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const normalizedEmail = normalizeAuthEmail(email);

    try {
      if (isWeakPassword(password)) {
        setError("Use at least 8 characters for your password.");
        return;
      }

      const account = await checkAuthEmailStatus(normalizedEmail);

      if (account.status === "confirmed") {
        setView("existing-confirmed");
        return;
      }

      if (account.status === "unconfirmed") {
        setView("check-email");
        setMessage("That account already exists but is not confirmed yet.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: profileSetupRedirect(),
        },
      });

      if (signUpError) {
        console.error("Signup failed", signUpError);
        setError("Could not create the account right now. Try again in a minute.");
        return;
      }

      if (data.session) {
        setView("setup-ready");
        return;
      }

      setView("check-email");
      setMessage("We sent a confirmation link. Check your inbox before logging in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    const normalizedEmail = normalizeAuthEmail(email);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: profileSetupRedirect(),
        },
      });
      if (resendError) {
        console.error("Confirmation resend failed", resendError);
        setError("Could not resend confirmation right now. Try again in a minute.");
        return;
      }
      setMessage("Confirmation email resent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend confirmation.");
    } finally {
      setResending(false);
    }
  };

  if (view === "existing-confirmed") {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Account exists</p>
          <h2 className="text-xl font-semibold text-white">Use the sign-in page</h2>
          <p className="text-sm leading-6 text-zinc-400">
            A confirmed Playdex account already uses{" "}
            <span className="font-medium text-zinc-200">{normalizeAuthEmail(email)}</span>.
          </p>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="inline-flex w-full items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (view === "check-email") {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Confirm your email</p>
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="text-sm leading-6 text-zinc-400">
            Use the confirmation link for{" "}
            <span className="font-medium text-zinc-200">{normalizeAuthEmail(email)}</span>, then
            sign in to finish your profile.
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
            Go to sign in
          </Link>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || !email.trim()}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending ? "Resending..." : "Resend confirmation"}
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
          <h2 className="text-xl font-semibold text-white">You are signed in</h2>
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
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/15"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Password</span>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/30 focus-within:border-indigo-400/50 focus-within:ring-2 focus-within:ring-indigo-400/15">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
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

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
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
