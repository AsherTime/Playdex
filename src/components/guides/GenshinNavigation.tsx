import Link from "next/link";

export function GenshinNavigation({ active }: { active: "guides" | "tiers" }) {
  return (
    <nav aria-label="Genshin sections" className="flex flex-wrap gap-5 border-b border-white/10 text-sm">
      {[{ key: "guides", label: "Character Guides", href: "/games/genshin-impact" },
        { key: "tiers", label: "Tier List", href: "/games/genshin-impact/tier-list" }].map(tab => (
        <Link key={tab.key} href={tab.href} aria-current={active === tab.key ? "page" : undefined}
          className={`border-b-2 py-3 font-medium transition ${active === tab.key ? "border-cyan-300 text-white" : "border-transparent text-zinc-400 hover:text-white"}`}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
