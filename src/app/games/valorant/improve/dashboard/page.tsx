import { Suspense } from "react";
import { ImproveDashboard } from "@/components/valorant-improve/ImproveDashboard";
import { ImproveShell } from "@/components/valorant-improve/ImproveShell";

export default function ValorantCoachDashboardPage() {
  return (
    <ImproveShell breadcrumb="Dashboard">
      <Suspense fallback={<p className="text-sm text-zinc-400">Loading dashboard…</p>}>
        <ImproveDashboard />
      </Suspense>
    </ImproveShell>
  );
}
