import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Log in</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Use your email and password to access your profile and training progress.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-zinc-400">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
