import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
          New password
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Choose a new password</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Use the reset link from your email, then save a fresh password for your account.
        </p>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
