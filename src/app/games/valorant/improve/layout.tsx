import { AuthGate } from "@/components/auth/AuthGate";

export default function ValorantImproveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate
      title="Sign in to use the Valorant planner"
      description="Log in or create an account to save daily task progress and keep your routine across devices."
    >
      {children}
    </AuthGate>
  );
}
