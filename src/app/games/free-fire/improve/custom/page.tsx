import { FreeFireCustomPlanBuilder } from "@/components/free-fire-improve/FreeFireCustomPlanBuilder";
import { FreeFireImproveShell } from "@/components/free-fire-improve/FreeFireImproveShell";

export default function FreeFireCustomPlanPage() {
  return (
    <FreeFireImproveShell breadcrumb="Make your own">
      <FreeFireCustomPlanBuilder />
    </FreeFireImproveShell>
  );
}
