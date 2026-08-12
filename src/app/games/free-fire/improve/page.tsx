"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Question = {
  id: string;
  level: "Basic" | "Intermediate" | "Advanced" | "Goal";
  title: string;
  helper: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  { id: "rank", level: "Basic", title: "What is your current Free Fire rank?", helper: "This helps us match the plan to your current level.", options: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Master", "Grandmaster", "Unranked"] },
  { id: "mode", level: "Basic", title: "Which mode do you mainly play?", helper: "Your training routine will focus on the situations you face most.", options: ["Battle Royale", "Clash Squad", "Both equally", "Solo", "Duo", "Squad"] },
  { id: "playstyle", level: "Basic", title: "What is your preferred playstyle?", helper: "Choose the role that best describes you during fights.", options: ["Rusher", "Support", "Sniper", "Balanced", "IGL / Shot caller"] },
  { id: "daily-time", level: "Basic", title: "How much time can you practise each day?", helper: "Your plan will stay within this daily time limit.", options: ["15 minutes", "30 minutes", "45–60 minutes", "1–2 hours", "More than 2 hours"] },
  { id: "weakness", level: "Basic", title: "What is your biggest weakness right now?", helper: "Your plan will give this area extra attention.", options: ["Aim", "Movement", "Gloo wall", "Positioning", "Game sense", "Close-range fights"] },
  { id: "weapon", level: "Intermediate", title: "Which weapon type are you most comfortable with?", helper: "Choose the category you trust most in an important fight.", options: ["SMG", "Assault rifle", "Shotgun", "Sniper", "Marksman rifle", "No clear preference"] },
  { id: "headshots", level: "Intermediate", title: "How consistent is your headshot accuracy?", helper: "Think about real matches, not only the training ground.", options: ["Poor", "Inconsistent", "Good", "Very consistent"] },
  { id: "drag-headshots", level: "Intermediate", title: "How comfortable are you with drag headshots?", helper: "Select the option closest to your current control level.", options: ["Beginner", "Still learning", "Sometimes consistent", "Highly consistent"] },
  { id: "gloo-speed", level: "Intermediate", title: "How quickly can you deploy a gloo wall under pressure?", helper: "Consider surprise attacks and close-range fights.", options: ["Slow", "Average", "Fast", "Very fast and accurate"] },
  { id: "rushed", level: "Intermediate", title: "What usually happens when an enemy rushes you?", helper: "Choose the issue that appears most often.", options: ["I panic", "I miss shots", "My gloo placement fails", "My movement becomes predictable", "I handle it comfortably"] },
  { id: "movement", level: "Advanced", title: "How strong is your combat movement?", helper: "Include strafing, jump timing, cover use, and unpredictability.", options: ["Basic", "Average", "Good", "Advanced"] },
  { id: "rotation", level: "Advanced", title: "How well do you choose rotations and safe positions?", helper: "Think about zone timing, terrain, cover, and enemy locations.", options: ["Poor", "Basic", "Usually good", "Advanced"] },
  { id: "squad-role", level: "Advanced", title: "Which role do you perform in squad matches?", helper: "Pick the job your teammates rely on you to do.", options: ["Entry fragger", "Support", "Sniper", "IGL", "Flanker", "Flexible"] },
  { id: "hard-situation", level: "Advanced", title: "Which situation causes you the most trouble?", helper: "Your advanced drills will prioritize this situation.", options: ["1v1", "1v2 or more", "Open-field fights", "Close-range fights", "End zone", "Defending a position"] },
  { id: "goal", level: "Goal", title: "What do you want to improve most in the next 7 days?", helper: "This becomes the main target of your personal plan.", options: ["Push rank", "Hit more headshots", "Master gloo walls", "Improve movement", "Survive longer", "Win close-range fights"] },
];

export default function FreeFireImprovePage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const question = QUESTIONS[current];
  const selected = answers[question?.id];
  const progress = Math.round(((current + (selected ? 1 : 0)) / QUESTIONS.length) * 100);
  const focusAreas = useMemo(() => Array.from(new Set([answers.weakness, answers.rushed, answers["hard-situation"]].filter(Boolean))).slice(0, 3), [answers]);

  function choose(option: string) {
    setAnswers((previous) => ({ ...previous, [question.id]: option }));
  }

  function next() {
    if (!selected) return;
    if (current < QUESTIONS.length - 1) {
      setCurrent((value) => value + 1);
      return;
    }
    try {
      localStorage.setItem("playdex-free-fire-assessment", JSON.stringify(answers));
    } catch {
      // The result remains available even if browser storage is blocked.
    }
    setCompleted(true);
  }

  function restart() {
    setAnswers({});
    setCurrent(0);
    setCompleted(false);
    setStarted(true);
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/games/free-fire" className="transition hover:text-white">Free Fire</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300">Improve</span>
      </nav>

      {!started ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Free Fire improvement planner</p>
              <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">Turn your weaknesses into a clear training plan.</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">Complete a 15-question assessment covering aim, movement, gloo walls, positioning, and high-pressure fights. Playdex will build your focused player profile.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => setStarted(true)} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-950/30 transition hover:brightness-110">Start assessment</button>
                <span className="text-xs text-zinc-500">15 questions · about 3 minutes</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {["5 basic profile questions", "5 mechanics questions", "4 advanced match questions", "1 clear seven-day goal"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-200">{index + 1}</span>
                  <p className="text-sm text-zinc-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : completed ? (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-6 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Assessment complete</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Your Free Fire training profile is ready.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">You are a {answers.rank} {answers.playstyle} focused on {answers.goal?.toLowerCase()}.</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-9">
            <ResultCard label="Main mode" value={answers.mode} />
            <ResultCard label="Daily practice" value={answers["daily-time"]} />
            <ResultCard label="Main weakness" value={answers.weakness} />
            <ResultCard label="Preferred weapon" value={answers.weapon} />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recommended focus</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focusAreas.map((area) => <span key={area} className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100">{area}</span>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/10 p-6 sm:px-9">
            <Link href="/games/free-fire/improve/plan" className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400">Build my 7-day plan</Link>
            <button onClick={restart} className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">Retake assessment</button>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5 sm:p-7">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{question.level} · Question {current + 1} of {QUESTIONS.length}</span>
              <span className="tabular-nums text-zinc-300">{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">{question.level}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{question.title}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{question.helper}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const active = selected === option;
                return (
                  <button key={option} type="button" onClick={() => choose(option)} className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${active ? "border-amber-400/60 bg-amber-500/15 text-white ring-1 ring-amber-400/20" : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"}`}>
                    <span>{option}</span>
                    <span className={`ml-3 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-amber-300 bg-amber-400 text-[11px] text-black" : "border-zinc-700"}`}>{active ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 p-5 sm:px-8">
            <button type="button" onClick={() => current === 0 ? setStarted(false) : setCurrent((value) => value - 1)} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white">Back</button>
            <button type="button" onClick={next} disabled={!selected} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">{current === QUESTIONS.length - 1 ? "Finish assessment" : "Next question"}</button>
          </div>
        </section>
      )}
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value || "Not provided"}</p>
    </div>
  );
}
