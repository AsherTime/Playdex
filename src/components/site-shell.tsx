"use client";

import Link from "next/link";
import { AuthNavLinks } from "@/components/auth/AuthNavLinks";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CapacitorInit } from "@/components/capacitor/CapacitorInit";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { useNativeAppChrome } from "@/hooks/use-native-app-chrome";

const mobileWebLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/improve", label: "Improve" },
  { href: "/news", label: "News" },
  { href: "/admin", label: "Admin" },
];

function SiteShellInner({ children }: { children: React.ReactNode }) {
  const nativeChrome = useNativeAppChrome();

  return (
    <div className="native-app-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.1),_transparent_28%),#070811] text-zinc-100">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-4 sm:px-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:px-8">
        <Sidebar />

        <div className="min-w-0">
          {!nativeChrome ? (
            <header className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:hidden">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                Gamedex
              </Link>
              <nav className="flex max-w-full gap-1 overflow-x-auto text-sm text-zinc-300">
                {mobileWebLinks.map((link) => (
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
          ) : null}

          <main className={nativeChrome ? "pb-[calc(4.75rem+env(safe-area-inset-bottom))]" : undefined}>
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CapacitorInit />
      <SiteShellInner>{children}</SiteShellInner>
    </AuthProvider>
  );
}
