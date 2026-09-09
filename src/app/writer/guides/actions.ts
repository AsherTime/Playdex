"use server";

import { revalidatePath } from "next/cache";
import {
  saveGuideDraft,
  submitGuideRevision,
} from "@/lib/guides/revisions";
import type { EditableGuideData } from "@/lib/guides/revision-types";

export async function saveGuideDraftAction(input: {
  characterSlug: string;
  revisionId?: string | null;
  payload: EditableGuideData;
}) {
  const revision = await saveGuideDraft(input.characterSlug, input.payload, input.revisionId ?? undefined);
  revalidatePath("/writer/guides");
  revalidatePath(`/games/genshin-impact/characters/${input.characterSlug}/edit`);
  return {
    id: revision.id,
    status: revision.status,
    sectionsChanged: revision.sectionsChanged,
    updatedAt: revision.updatedAt,
  };
}

export async function submitGuideRevisionAction(revisionId: string) {
  const revision = await submitGuideRevision(revisionId);
  revalidatePath("/writer/guides");
  revalidatePath("/admin/reviews");
  return {
    id: revision.id,
    status: revision.status,
    submittedAt: revision.submittedAt,
  };
}
