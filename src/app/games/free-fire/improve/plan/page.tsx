import { FreeFireImprovePlanView } from "@/components/free-fire-improve/FreeFireImprovePlanView";
import { FreeFireImproveShell } from "@/components/free-fire-improve/FreeFireImproveShell";

export default function FreeFireImprovePlanPage() {
  return (
    <FreeFireImproveShell breadcrumb="Plan">
      <FreeFireImprovePlanView />
    </FreeFireImproveShell>
  );
}
