import { notFound } from "next/navigation";
import { GenshinNavigation } from "@/components/guides/GenshinNavigation";
import { CharacterTierList } from "@/components/tier-lists/CharacterTierList";
import { getTierList } from "@/lib/tier-lists/server";

export const dynamic = "force-dynamic";

export default async function TierListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "genshin-impact") notFound();
  const data = await getTierList(slug);
  if (!data) notFound();
  return <div className="min-w-0 space-y-5">
    <header>
      <p className="text-xs font-medium text-cyan-300">Genshin Impact</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-white">Character Tier List</h1>
        {data.list.version ? <span className="text-xs text-zinc-400">Version {data.list.version}</span> : null}
      </div>
      <GenshinNavigation active="tiers" />
    </header>
    <CharacterTierList data={data} />
  </div>;
}
