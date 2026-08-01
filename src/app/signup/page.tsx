import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
          Create account
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sign up</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Create an account with email and password. We&apos;ll email you a confirmation link —
          finish your profile after you log in.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-zinc-400">Loading…</p>}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
