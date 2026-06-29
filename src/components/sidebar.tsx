import Link from "next/link";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { RecentlyViewedGames } from "@/components/recently-viewed-games";
import { getRecentlyViewedGames } from "@/lib/content";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/trending", label: "Trending" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/news", label: "News" },
  { href: "/games", label: "Games" },
  { href: "/streamers", label: "Streamers" },
  { href: "/esports", label: "Esports" },
  { href: "/community", label: "Community" },
];

const tools = ["Bookmarks", "Watchlist", "Settings"];

export function Sidebar() {
  const recentGames = getRecentlyViewedGames();

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-6 space-y-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
        <div>
          <Link href="/" className="px-3 text-xl font-semibold tracking-tight text-white">
            Gamedex
          </Link>
          <nav className="mt-5 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <RecentlyViewedGames games={recentGames} />

        <section className="space-y-2">
          <p className="px-3 text-xs uppercase tracking-[0.24em] text-zinc-500">User Tools</p>
          {tools.map((tool) => (
            <button
              key={tool}
              type="button"
              className="block w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/[0.05]"
            >
              {tool}
            </button>
          ))}
          <DarkModeToggle />
        </section>
      </div>
    </aside>
  );
}
