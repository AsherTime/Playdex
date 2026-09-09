"use server";

import { revalidatePath } from "next/cache";
import { approveAndPublishGuideRevision, rejectGuideRevision } from "@/lib/guides/revisions";

export async function approveGuideRevisionAction(revisionId: string) {
  const revision = await approveAndPublishGuideRevision(revisionId);
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${revisionId}`);
  revalidatePath(`/games/genshin-impact/characters/${revision.characterSlug}`);
  return { id: revision.id, status: revision.status };
}

export async function rejectGuideRevisionAction(revisionId: string, reviewNote: string) {
  const revision = await rejectGuideRevision(revisionId, reviewNote);
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${revisionId}`);
  revalidatePath("/writer/guides");
  return { id: revision.id, status: revision.status };
}
