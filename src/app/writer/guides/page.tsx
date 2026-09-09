import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { listEditableGuideCharacters, listWriterGuideRevisions } from "@/lib/guides/revisions";
import { getCurrentUserWithRole } from "@/lib/roles";

export default async function WriterGuidesPage() {
  const user = await getCurrentUserWithRole();
  if (!user) redirect("/login?next=/writer/guides");
  if (!["writer", "admin"].includes(user.role)) notFound();

  const [revisions, characters] = await Promise.all([
    listWriterGuideRevisions(),
    listEditableGuideCharacters(),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Writer"
        title="Guide Workspace"
        description="Save drafts, submit guide changes, and track review status."
      />

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <h2 className="text-base font-semibold text-white">Your Revisions</h2>
        <div className="mt-3 space-y-2">
          {revisions.length ? (
            revisions.map((revision) => (
              <Link
                key={revision.id}
                href={`/games/genshin-impact/characters/${revision.characterSlug}/edit?revision=${revision.id}`}
                className="block rounded-xl border border-white/10 bg-black/20 px-3 py-3 transition hover:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{revision.characterName}</p>
                    <p className="text-xs text-zinc-500">
                      {revision.sectionsChanged.join(", ") || "No changes"} · Updated{" "}
                      {new Date(revision.updatedAt).toLocaleString()}
                    </p>
                    {revision.reviewNote ? <p className="mt-1 text-xs text-rose-200">{revision.reviewNote}</p> : null}
                  </div>
                  <span className="w-fit rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs capitalize text-zinc-300">
                    {revision.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">
              No guide drafts yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <h2 className="text-base font-semibold text-white">Genshin Characters</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/games/genshin-impact/characters/${character.slug}/edit`}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 transition hover:bg-white/[0.05]"
            >
              <p className="font-medium text-white">{character.name}</p>
              <p className="text-xs text-zinc-500">{character.element ?? "Unknown element"}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
