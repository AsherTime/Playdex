import Link from "next/link";
import { AuthNavLinks } from "@/components/auth/AuthNavLinks";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/improve", label: "Improvement" },
  { href: "/news", label: "News" },
  { href: "/admin", label: "Admin" },
];

const improveGames = [
  { href: "/games/valorant/improve", label: "Valorant" },
  { href: "/games/free-fire/improve", label: "Free Fire" },
];

export function Sidebar() {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-6 space-y-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <Link href="/" className="px-3 text-xl font-semibold tracking-tight text-white">
            Gamedex
          </Link>
          <nav className="mt-5 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <AuthNavLinks />
          </nav>

          <div className="mt-4 border-t border-white/5 pt-4">
            <p className="px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Select game
            </p>
            <div className="mt-2 space-y-1">
              {improveGames.map((game) => (
                <Link
                  key={game.href}
                  href={game.href}
                  className="block rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  {game.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
