import { notFound } from "next/navigation";
import { GameCard } from "@/components/game-card";
import { GameCalcHubPage } from "@/components/game-calc/GameCalcHubPage";
import { GameDetailHeader } from "@/components/game-detail-header";
import { NewsCard } from "@/components/news-card";
import { SectionHeader } from "@/components/section-header";
import { games } from "@/data/mock-data";
import { getGameDetail } from "@/lib/games";
import { isCalcGame } from "@/lib/team-games";

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (isCalcGame(slug)) {
    return <GameCalcHubPage slug={slug} />;
  }

  const game = await getGameDetail(slug);
  if (!game) notFound();

  return (
    <div className="space-y-6">
      <GameDetailHeader game={game} />

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel title="Latest updates" items={game.latestUpdates} />
        <InfoPanel title="Future updates / roadmap" items={game.roadmap} />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Latest news" />
        <div className="space-y-3">
          {game.latestNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {game.similarGames.length ? (
        <section className="space-y-4">
          <SectionHeader title="Similar games" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {game.similarGames.map((item) => (
              <GameCard key={item.id} game={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-medium text-white">{title}</h2>
      <ul className="space-y-2 text-sm text-zinc-300">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-black/20 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
