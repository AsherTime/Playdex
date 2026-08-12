"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNativeAppChrome } from "@/hooks/use-native-app-chrome";

const tabs = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/improve",
    label: "Improve",
    match: (path: string) => path === "/improve" || path.includes("/improve"),
  },
  {
    href: "/games",
    label: "Games",
    match: (path: string) =>
      (path === "/games" || path.startsWith("/games/")) && !path.includes("/improve"),
  },
  { href: "/news", label: "News", match: (path: string) => path === "/news" || path.startsWith("/news") },
  {
    href: "/profile",
    label: "Profile",
    match: (path: string) =>
      path === "/profile" ||
      path.startsWith("/profile/") ||
      path === "/login" ||
      path === "/signup",
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const showChrome = useNativeAppChrome();

  if (!showChrome) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#070811]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] xl:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px] font-medium transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
              }`}
            >
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
