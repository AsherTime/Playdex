import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type TrainingProgressMap = Record<number, string[]>;

export async function loadTrainingProgressFromSupabase(
  gameSlug: string,
): Promise<TrainingProgressMap> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from("user_training_progress")
    .select("plan_day, task_id, is_completed")
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .eq("is_completed", true);

  if (error || !data) return {};

  const map: TrainingProgressMap = {};
  for (const row of data) {
    if (!map[row.plan_day]) map[row.plan_day] = [];
    map[row.plan_day].push(row.task_id);
  }
  return map;
}

export async function upsertTrainingTaskProgress(input: {
  gameSlug: string;
  planDay: number;
  taskId: string;
  taskTitle: string;
  isCompleted: boolean;
}) {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("user_training_progress").upsert(
    {
      user_id: user.id,
      game_slug: input.gameSlug,
      plan_day: input.planDay,
      task_id: input.taskId,
      task_title: input.taskTitle,
      is_completed: input.isCompleted,
      completed_at: input.isCompleted ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,game_slug,plan_day,task_id" },
  );

  if (error) {
    console.error("Failed to save training progress", error.message);
  }
}

export function mergeCompletedTasks(
  local: TrainingProgressMap,
  remote: TrainingProgressMap,
): TrainingProgressMap {
  const days = new Set([
    ...Object.keys(local).map(Number),
    ...Object.keys(remote).map(Number),
  ]);
  const merged: TrainingProgressMap = {};

  for (const day of days) {
    merged[day] = Array.from(
      new Set([...(local[day] ?? []), ...(remote[day] ?? [])]),
    );
  }

  return merged;
}
