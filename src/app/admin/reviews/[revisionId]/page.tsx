import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GuideReviewActions } from "@/components/guides/GuideReviewActions";
import { getGuideRevisionDiff } from "@/lib/guides/revision-diff";
import { getAdminGuideReview } from "@/lib/guides/revisions";
import { getCurrentUserWithRole } from "@/lib/roles";

export default async function AdminGuideReviewDetailPage({
  params,
}: {
  params: Promise<{ revisionId: string }>;
}) {
  const { revisionId } = await params;
  const user = await getCurrentUserWithRole();
  if (!user) redirect(`/login?next=/admin/reviews/${revisionId}`);
  if (user.role !== "admin") notFound();

  const revision = await getAdminGuideReview(revisionId);
  if (!revision) notFound();

  const diff = getGuideRevisionDiff(revision.base, revision.draft);

  return (
    <div className="space-y-5">
      <nav className="text-sm text-zinc-500">
        <Link href="/admin/reviews" className="transition hover:text-white">
          Guide reviews
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-300">{revision.characterName}</span>
      </nav>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{revision.gameId}</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{revision.characterName}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Writer: {revision.authorName}
              {revision.authorEmail ? ` · ${revision.authorEmail}` : ""}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Submitted {revision.submittedAt ? new Date(revision.submittedAt).toLocaleString() : "not submitted"}
            </p>
          </div>
          <span className="w-fit rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs capitalize text-zinc-300">
            {revision.status.replace("_", " ")}
          </span>
        </div>
      </section>

      <GuideReviewActions revisionId={revision.id} disabled={revision.status !== "pending_review"} />

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <h2 className="text-base font-semibold text-white">Changes</h2>
        {diff.length ? (
          <div className="space-y-3">
            {diff.map((line, index) => (
              <article key={`${line.section}-${line.label}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wide text-cyan-200">{line.section}</p>
                <h3 className="mt-1 text-sm font-semibold text-white">{line.label}</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <DiffBlock label="Old" value={line.oldValue} />
                  <DiffBlock label="New" value={line.newValue} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
            This revision has no content changes.
          </p>
        )}
      </section>
    </div>
  );
}

function DiffBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 max-h-80 overflow-auto whitespace-pre-line text-sm leading-6 text-zinc-300">
        {value || "None"}
      </p>
    </div>
  );
}
