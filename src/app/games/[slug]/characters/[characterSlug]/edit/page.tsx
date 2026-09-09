import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GuideEditorForm } from "@/components/guides/GuideEditorForm";
import { getEditableGuideForCharacter } from "@/lib/guides/revisions";
import { getCurrentUserWithRole } from "@/lib/roles";

export default async function EditCharacterGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; characterSlug: string }>;
  searchParams: Promise<{ revision?: string }>;
}) {
  const { slug, characterSlug } = await params;
  const { revision } = await searchParams;
  if (slug !== "genshin-impact") notFound();
  const user = await getCurrentUserWithRole();
  if (!user) redirect(`/login?next=/games/${slug}/characters/${characterSlug}/edit`);
  if (!["writer", "admin"].includes(user.role)) notFound();

  const guide = await getEditableGuideForCharacter(characterSlug, revision);
  if (!guide) notFound();

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-500">
        <Link href={`/games/${slug}/characters/${characterSlug}`} className="transition hover:text-white">
          Public guide
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link href="/writer/guides" className="transition hover:text-white">
          Writer workspace
        </Link>
      </nav>
      <GuideEditorForm
        characterSlug={characterSlug}
        initialData={guide.initialData}
        initialRevision={
          guide.revision
            ? {
                id: guide.revision.id,
                status: guide.revision.status,
                reviewNote: guide.revision.reviewNote,
                sectionsChanged: guide.revision.sectionsChanged,
              }
            : null
        }
      />
    </div>
  );
}
