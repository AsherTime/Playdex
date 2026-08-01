import { ValorantCustomPlanBuilder } from "@/components/valorant-improve/ValorantCustomPlanBuilder";
import { ImproveShell } from "@/components/valorant-improve/ImproveShell";

export default function ValorantCustomPlanPage() {
  return (
    <ImproveShell breadcrumb="Make your own">
      <ValorantCustomPlanBuilder />
    </ImproveShell>
  );
}
