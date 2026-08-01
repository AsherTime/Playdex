import { FreeFireImproveQuestionnaire } from "@/components/free-fire-improve/FreeFireImproveQuestionnaire";
import { FreeFireImproveShell } from "@/components/free-fire-improve/FreeFireImproveShell";

export default function FreeFireImproveQuestionsPage() {
  return (
    <FreeFireImproveShell breadcrumb="Questions">
      <FreeFireImproveQuestionnaire />
    </FreeFireImproveShell>
  );
}
