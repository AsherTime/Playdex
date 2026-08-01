"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthGate({
  children,
  title = "Sign in to continue",
  description = "Create an account or log in to save your training progress and personalize your feed.",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const next = encodeURIComponent(pathname);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
            Account required
          </p>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="max-w-xl text-sm leading-6 text-zinc-400">{description}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/login?next=${next}`}
              className="inline-flex rounded-full border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-medium text-indigo-50 transition hover:bg-indigo-500/25"
            >
              Log in
            </Link>
            <Link
              href={`/signup?next=${next}`}
              className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
