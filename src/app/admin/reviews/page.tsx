import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { listPendingGuideReviews } from "@/lib/guides/revisions";
import { getCurrentUserWithRole } from "@/lib/roles";

export default async function AdminGuideReviewsPage() {
  const user = await getCurrentUserWithRole();
  if (!user) redirect("/login?next=/admin/reviews");
  if (user.role !== "admin") notFound();

  const revisions = await listPendingGuideReviews();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Admin"
        title={revisions.length ? `Reviews (${revisions.length})` : "Reviews"}
        description="Pending writer submissions waiting for approval."
      />

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <h2 className="text-base font-semibold text-white">Pending review</h2>
        <div className="mt-3 space-y-2">
          {revisions.length ? (
            revisions.map((revision) => (
              <Link
                key={revision.id}
                href={`/admin/reviews/${revision.id}`}
                className="block rounded-xl border border-white/10 bg-black/20 px-3 py-3 transition hover:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{revision.characterName}</p>
                    <p className="text-xs text-zinc-500">
                      {revision.gameId} · {revision.authorName} ·{" "}
                      {revision.submittedAt ? new Date(revision.submittedAt).toLocaleString() : "Not submitted"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {revision.sectionsChanged.join(", ") || "No changed sections"}
                    </p>
                  </div>
                  <span className="w-fit rounded-md border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-xs capitalize text-amber-100">
                    {revision.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
              No pending reviews.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
