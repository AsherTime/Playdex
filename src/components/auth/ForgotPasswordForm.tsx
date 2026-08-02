"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { checkAuthEmailStatus, normalizeAuthEmail } from "@/lib/auth/email-status";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const normalizedEmail = normalizeAuthEmail(email);

    try {
      const account = await checkAuthEmailStatus(normalizedEmail);
      if (account.status === "not_found") {
        setError("No Playdex account uses that email yet. Create an account to get started.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/reset-password`
            : undefined,
      });

      if (resetError) {
        console.error("Password reset email failed", resetError);
        setError("We could not send a reset link right now. Try again in a minute.");
        return;
      }

      if (account.status === "unconfirmed") {
        setMessage(
          "That account is not confirmed yet. We still sent a reset link if Supabase allows it; check your inbox or sign up again to resend confirmation.",
        );
      } else {
        setMessage("Password reset link sent. Check your inbox and follow the secure link.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start password reset.");
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

      {message ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      {error ? (
        <div className="space-y-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          <p>{error}</p>
          {error.startsWith("No Playdex account") ? (
            <Link href="/signup" className="font-medium text-indigo-200 hover:text-indigo-100">
              Create account
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending reset link..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Remembered it?{" "}
        <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
          Log in
        </Link>
      </p>
    </form>
  );
}
