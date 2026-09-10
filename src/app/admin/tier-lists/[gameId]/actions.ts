"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { TierEntryInput } from "@/lib/tier-lists/types";

export async function saveTierList(id: string, revision: number, entries: TierEntryInput[]) {
  await requireAdmin();
  if (!Array.isArray(entries) || entries.length > 3000 || !Number.isInteger(revision)) {
    return { error: "Invalid tier list." };
  }
  const keys = new Set<string>();
  for (const entry of entries) {
    if (!entry || typeof entry.character_id !== "string" || typeof entry.role !== "string" ||
        typeof entry.tier !== "string" || !Number.isInteger(entry.sort_order) || entry.sort_order < 0 ||
        (entry.notes !== null && (typeof entry.notes !== "string" || entry.notes.length > 2000))) {
      return { error: "Invalid character placement." };
    }
    const key = `${entry.character_id}|${entry.role}`;
    if (keys.has(key)) return { error: "A character can only appear once in each role." };
    keys.add(key);
  }
  const db = createServiceSupabaseClient();
  const { data: list, error: listError } = await db.from("game_character_tier_lists").select("game_id").eq("id", id).single();
  if (listError || !list) return { error: "Tier list not found." };
  const { data, error } = await db.rpc("save_character_tier_list", { p_id: id, p_revision: revision, p_entries: entries });
  if (error) return { error: error.code === "40001" ? "Another admin updated this list. Reload before saving." : "Could not save these placements. Check tiers, roles, and characters." };
  revalidatePath(`/games/${list.game_id}/tier-list`);
  revalidatePath(`/admin/tier-lists/${list.game_id}`);
  return { revision: data };
}
