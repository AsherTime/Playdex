import { notFound } from "next/navigation";
import { GameCard } from "@/components/game-card";
import { GameDetailHeader } from "@/components/game-detail-header";
import { MiniChart } from "@/components/mini-chart";
import { PostCard } from "@/components/post-card";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { StreamerCard } from "@/components/streamer-card";
import { YouTuberCard } from "@/components/youtuber-card";
import { EsportsCard } from "@/components/esports-card";
import { games } from "@/data/mock-data";
import { getGameDetail } from "@/lib/games";

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameDetail(slug);

  if (!game) notFound();

  return (
    <div className="space-y-6">
      <GameDetailHeader game={game} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Trend score" value={game.trend.score} helper="Blended momentum" />
        <StatCard label="Worth trying?" value={`${game.trend.worthTryingScore}/100`} helper="Discovery confidence" />
        <StatCard label="Community sentiment" value={`${game.communitySentiment.score}/100`} helper={game.communitySentiment.label} />
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <MiniChart values={game.metrics.map((metric) => metric.playerCount)} label="Player activity" tone="cyan" />
        <MiniChart values={game.metrics.map((metric) => metric.twitchViewers)} label="Streaming activity" tone="violet" />
        <MiniChart values={game.metrics.map((metric) => metric.youtubeHype)} label="YouTube hype" tone="emerald" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel title="Latest updates" items={game.latestUpdates} />
        <InfoPanel title="Future updates / roadmap" items={game.roadmap} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Top Twitch streamers">
          {game.topStreamers.length ? (
            game.topStreamers.map((streamer) => <StreamerCard key={streamer.id} streamer={streamer} />)
          ) : (
            <EmptyState text="No dedicated streamer cluster yet." />
          )}
        </Panel>
        <Panel title="Top YouTubers">
          {game.topYouTubers.length ? (
            game.topYouTubers.map((creator) => <YouTuberCard key={creator.id} creator={creator} />)
          ) : (
            <EmptyState text="No dedicated creator cluster yet." />
          )}
        </Panel>
        <Panel title="Esports updates">
          {game.esportsUpdates.length ? (
            game.esportsUpdates.map((event) => <EsportsCard key={event.id} event={event} />)
          ) : (
            <EmptyState text="No esports signal for this title right now." />
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <SectionHeader title="Community sentiment" />
          <p className="mt-4 text-sm leading-6 text-zinc-400">{game.communitySentiment.summary}</p>
        </div>
        <div className="space-y-4">
          <SectionHeader title="Latest news / posts" />
          <div className="space-y-4">
            {game.latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Similar games" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {game.similarGames.map((item) => (
            <GameCard key={item.id} game={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel title={title}>
      <ul className="space-y-2 text-sm text-zinc-300">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-black/20 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-medium text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl bg-black/20 px-3 py-2 text-sm text-zinc-500">{text}</p>;
}
