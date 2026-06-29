import { SectionHeader } from "@/components/section-header";
import { getUpcomingGames } from "@/lib/games";
import { formatDate } from "@/utils/formatters";

export default function UpcomingPage() {
  const upcoming = getUpcomingGames();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Launch radar"
        title="Upcoming Games"
        description="A pre-release view of the games with the strongest current interest signals."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {upcoming.map((game) => (
          <article key={game.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm text-zinc-400">{formatDate(game.releaseDate)}</p>
                <h2 className="mt-2 text-xl font-medium text-white">{game.title}</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {game.genre} · {game.platforms.join(", ")}
                </p>
              </div>
              <div className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-zinc-300">
                Hype <span className="font-medium text-white">{game.hypeScore}</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info label="Wishlist / interest" value={`${game.wishlistInterest}/100`} />
              <Info label="Trailer" value="Placeholder" />
              <Info label="News link" value="Placeholder" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  );
}
