import { ImprovePlanView } from "@/components/valorant-improve/ImprovePlanView";
import { ImproveShell } from "@/components/valorant-improve/ImproveShell";

export default function ValorantImprovePlanPage() {
  return (
    <ImproveShell breadcrumb="Plan">
      <ImprovePlanView />
    </ImproveShell>
  );
}
