import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/roles";
import { getTierList } from "@/lib/tier-lists/server";
import { TierListEditor } from "@/components/tier-lists/TierListEditor";

export default async function AdminTierListPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await getCurrentUserWithRole();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/tier-lists/${gameId}`)}`);
  if (user.role !== "admin") notFound();
  const data = await getTierList(gameId);
  if (!data) notFound();
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">Edit {data.list.name}</h1>
      <Link href={`/games/${gameId}/tier-list`} className="text-sm text-cyan-200">View tier list</Link>
    </div>
    <TierListEditor data={data} />
  </div>;
}
