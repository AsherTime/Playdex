"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doPasswordsMismatch, isWeakPassword } from "@/lib/auth/password";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "ready" | "expired";

export function ResetPasswordForm() {
  const router = useRouter();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let sawRecoveryEvent = false;

    const finishCheck = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setRecoveryState("ready");
      } else if (!sawRecoveryEvent) {
        setRecoveryState("expired");
      }
    }, 800);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        sawRecoveryEvent = true;
        setRecoveryState(session ? "ready" : "expired");
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoveryState("ready");
    });

    return () => {
      window.clearTimeout(finishCheck);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isWeakPassword(password)) {
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (doPasswordsMismatch(password, confirmation)) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error("Password update failed", updateError);
        setError("That reset link is expired or invalid. Request another reset link.");
        setRecoveryState("expired");
        return;
      }

      setMessage("Password updated. Redirecting you to log in...");
      await supabase.auth.signOut();
      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  if (recoveryState === "checking") {
    return <p className="text-sm text-zinc-400">Checking your reset link...</p>;
  }

  if (recoveryState === "expired") {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          This reset link is invalid or expired. Request another reset link and use the newest
          email.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25"
        >
          Request another reset
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          New password
        </span>
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

      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Confirm password
        </span>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/30 focus-within:border-indigo-400/50 focus-within:ring-2 focus-within:ring-indigo-400/15">
          <input
            type={showConfirmation ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
          />
          <button
            type="button"
            onClick={() => setShowConfirmation((value) => !value)}
            className="shrink-0 px-3 text-xs font-medium text-zinc-300 hover:text-white"
          >
            {showConfirmation ? "Hide" : "Show"}
          </button>
        </div>
      </label>

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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving password..." : "Save new password"}
      </button>
    </form>
  );
}
