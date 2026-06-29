import { EsportsCard } from "@/components/esports-card";
import { StreamerCard } from "@/components/streamer-card";
import { YouTuberCard } from "@/components/youtuber-card";
import type { EsportsEvent, GameWithTrend, Streamer, YouTuber } from "@/types/gamedex";

export function RightSidebar({
  streamers,
  creators,
  popularGames,
  esportsEvents,
  risingGames,
  droppingGames,
}: {
  streamers: Streamer[];
  creators: YouTuber[];
  popularGames?: GameWithTrend[];
  esportsEvents?: EsportsEvent[];
  risingGames?: GameWithTrend[];
  droppingGames?: GameWithTrend[];
}) {
  return (
    <aside className="space-y-5">
      <RailSection title="Top Twitch Streamers">
        {streamers.slice(0, 3).map((streamer) => (
          <StreamerCard key={streamer.id} streamer={streamer} />
        ))}
      </RailSection>

      <RailSection title="Top YouTubers">
        {creators.slice(0, 3).map((creator) => (
          <YouTuberCard key={creator.id} creator={creator} />
        ))}
      </RailSection>

      {popularGames ? (
        <RailSection title="Popular Games Right Now">
          {popularGames.slice(0, 4).map((game, index) => (
            <div key={game.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-white">
                  #{index + 1} {game.title}
                </p>
                <p className="text-xs text-zinc-500">{game.genre}</p>
              </div>
              <span className="text-sm text-indigo-100">{game.trend.score}</span>
            </div>
          ))}
        </RailSection>
      ) : null}

      {esportsEvents ? (
        <RailSection title="Upcoming Esports">
          {esportsEvents.slice(0, 3).map((event) => (
            <EsportsCard key={event.id} event={event} />
          ))}
        </RailSection>
      ) : null}

      {risingGames ? (
        <RailSection title="Fastest Momentum">
          {risingGames.slice(0, 4).map((game) => (
            <div key={game.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
              <span className="text-sm text-white">{game.title}</span>
              <span className="text-sm text-emerald-200">+{game.latestMetric.playerGrowth.toFixed(1)}%</span>
            </div>
          ))}
        </RailSection>
      ) : null}

      {droppingGames ? (
        <RailSection title="Dropping Fastest">
          {droppingGames.slice(0, 4).map((game) => (
            <div key={game.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
              <span className="text-sm text-white">{game.title}</span>
              <span className="text-sm text-rose-200">{game.trend.score}</span>
            </div>
          ))}
        </RailSection>
      ) : null}
    </aside>
  );
}

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-medium text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
