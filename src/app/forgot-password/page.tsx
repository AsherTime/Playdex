import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-indigo-300/80">
          Account recovery
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Enter the email on your Playdex account and we will send a secure reset link.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
