import type { ImprovementSnapshot } from "@/lib/public-profile";
import { loadFreeFirePlan } from "@/lib/free-fire-improve-storage";
import { loadPlan as loadValorantPlan } from "@/lib/valorant-improve-storage";
import { FOLLOWABLE_GAMES } from "@/data/followable-games";

function gameTitle(slug: string): string {
  return FOLLOWABLE_GAMES.find((g) => g.slug === slug)?.title ?? slug;
}

export function buildImprovementSnapshotFromLocal(): ImprovementSnapshot | null {
  const valorantPlan = loadValorantPlan();
  if (valorantPlan) {
    const day = valorantPlan.days.find((d) => d.day === valorantPlan.activeDay);
    const completed = valorantPlan.completedTasks[valorantPlan.activeDay] ?? [];
    const tasks = day?.tasks ?? [];
    return {
      gameSlug: "valorant",
      gameName: "Valorant",
      focusAreas: valorantPlan.summary.weaknesses.slice(0, 4),
      activeDay: valorantPlan.activeDay,
      completedTasks: completed.length,
      totalTasks: tasks.length,
      todayTasks: tasks.slice(0, 5).map((task) => task.title),
    };
  }

  const freeFirePlan = loadFreeFirePlan();
  if (freeFirePlan) {
    const day = freeFirePlan.days.find((d) => d.day === freeFirePlan.activeDay);
    const completed = freeFirePlan.completedTasks[freeFirePlan.activeDay] ?? [];
    const tasks = day?.tasks ?? [];
    return {
      gameSlug: "free-fire",
      gameName: "Free Fire",
      focusAreas: freeFirePlan.summary.weaknesses.slice(0, 4),
      activeDay: freeFirePlan.activeDay,
      completedTasks: completed.length,
      totalTasks: tasks.length,
      todayTasks: tasks.slice(0, 5).map((task) => task.title),
    };
  }

  return null;
}

export function getActiveImprovementGameSlug(): string | null {
  if (loadValorantPlan()) return "valorant";
  if (loadFreeFirePlan()) return "free-fire";
  return null;
}

export function getActiveImprovementGameName(): string | null {
  const slug = getActiveImprovementGameSlug();
  return slug ? gameTitle(slug) : null;
}
