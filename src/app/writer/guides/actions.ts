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

export async function submitGuideRevisionAction(input: {
  characterSlug: string;
  revisionId?: string | null;
  payload: EditableGuideData;
}) {
  const revision = await submitGuideRevision(input);
  revalidatePath("/writer/guides");
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath(`/games/genshin-impact/characters/${input.characterSlug}/edit`);
  return {
    id: revision.id,
    status: revision.status,
    submittedAt: revision.submittedAt,
  };
}
