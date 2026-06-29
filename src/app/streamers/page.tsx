import { SectionHeader } from "@/components/section-header";
import { StreamerCard } from "@/components/streamer-card";
import { getTopStreamers } from "@/lib/content";

export default function StreamersPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Creators"
        title="Streamers"
        description="Mock creator intelligence showing who is pulling attention across the current game map."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {getTopStreamers().map((streamer) => (
          <StreamerCard key={streamer.id} streamer={streamer} />
        ))}
      </div>
    </div>
  );
}
