import Link from "next/link";
import { AuthNavLinks } from "@/components/auth/AuthNavLinks";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Sidebar } from "@/components/sidebar";

const mobileLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/improve", label: "Improve" },
  { href: "/news", label: "News" },
  { href: "/admin", label: "Admin" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.1),_transparent_28%),#070811] text-zinc-100">
        <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-4 sm:px-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:px-8">
          <Sidebar />

          <div className="min-w-0">
            <header className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:hidden">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                Gamedex
              </Link>
              <nav className="flex max-w-full gap-1 overflow-x-auto text-sm text-zinc-300">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-white/[0.05]"
                  >
                    {link.label}
                  </Link>
                ))}
                <AuthNavLinks compact />
              </nav>
            </header>

            <main>{children}</main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
