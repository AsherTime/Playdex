import { ImproveCard } from "@/components/valorant-improve/ImproveShell";
import { getDayCompletion } from "@/lib/valorant-improve-plan";
import type { ImprovementPlan } from "@/types/valorant-improve";

export function TodayPlanPanel({
  plan,
  focus,
  onStart,
  onComplete,
  onSkip,
}: {
  plan: ImprovementPlan;
  focus: string;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
}) {
  const day = plan.days.find((entry) => entry.day === plan.activeDay);
  const completion = getDayCompletion(plan, plan.activeDay);
  if (!day) return null;

  return (
    <div className="space-y-4">
      <ImproveCard className="p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose-300/80">
          Today&apos;s Training — {plan.summary.practiceTime}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{day.label}</h2>
        <p className="mt-2 text-sm text-zinc-400">{completion}% resolved · Day {plan.activeDay} of 7</p>
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-rose-200/80">Today&apos;s Focus</p>
          <p className="mt-1 text-sm font-medium text-white">{focus}</p>
        </div>
      </ImproveCard>

      <div className="space-y-3">
        {day.tasks.map((task) => {
          const completed = (plan.completedTasks[plan.activeDay] ?? []).includes(task.id);
          const skipped = (plan.skippedTasks?.[plan.activeDay] ?? []).includes(task.id);
          const started = (plan.startedTasks?.[plan.activeDay] ?? []).includes(task.id);

          return (
            <ImproveCard key={task.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {task.duration}
                </span>
                {completed ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Done
                  </span>
                ) : null}
                {skipped ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Skipped
                  </span>
                ) : null}
                {started && !completed && !skipped ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    In progress
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{task.title}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{task.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStart(task.id)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05]"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => onComplete(task.id)}
                  className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/20"
                >
                  {completed ? "Undo" : "Complete"}
                </button>
                <button
                  type="button"
                  onClick={() => onSkip(task.id)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  {skipped ? "Unskip" : "Skip"}
                </button>
              </div>
            </ImproveCard>
          );
        })}
      </div>
    </div>
  );
}
