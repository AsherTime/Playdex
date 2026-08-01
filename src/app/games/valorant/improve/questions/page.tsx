import { ImproveQuestionnaire } from "@/components/valorant-improve/ImproveQuestionnaire";
import { ImproveShell } from "@/components/valorant-improve/ImproveShell";

export default function ValorantImproveQuestionsPage() {
  return (
    <ImproveShell breadcrumb="Questions">
      <ImproveQuestionnaire />
    </ImproveShell>
  );
}
