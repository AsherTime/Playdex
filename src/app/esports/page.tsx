import { EsportsCard } from "@/components/esports-card";
import { SectionHeader } from "@/components/section-header";
import { getUpcomingEsportsEvents } from "@/lib/content";

export default function EsportsPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Competition"
        title="Esports"
        description="Upcoming events and tournament signals that can bend attention around a title."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {getUpcomingEsportsEvents().map((event) => (
          <EsportsCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
