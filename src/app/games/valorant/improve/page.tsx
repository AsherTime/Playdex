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
  {
    id: "rank",
    level: "Basic",
    title: "What is your current Valorant rank?",
    helper: "This helps us set the right difficulty for your plan.",
    options: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant", "Unranked"],
  },
  {
    id: "role",
    level: "Basic",
    title: "Which role do you play most?",
    helper: "Choose the role you use in most competitive matches.",
    options: ["Duelist", "Initiator", "Controller", "Sentinel", "Flex / Fill"],
  },
  {
    id: "agent",
    level: "Basic",
    title: "Which agent type best matches your main agent?",
    helper: "You can refine your exact agent later in your plan.",
    options: ["Entry / aggressive", "Information / setup", "Smokes / map control", "Site anchor / support", "I regularly switch agents"],
  },
  {
    id: "daily-time",
    level: "Basic",
    title: "How much time can you practise each day?",
    helper: "Your routine will be designed to fit this time limit.",
    options: ["15 minutes", "30 minutes", "45–60 minutes", "1–2 hours", "More than 2 hours"],
  },
  {
    id: "weakness",
    level: "Basic",
    title: "What is your biggest weakness right now?",
    helper: "Be honest—your plan will give this area extra attention.",
    options: ["Aim", "Movement", "Game sense", "Utility usage", "Positioning", "Communication"],
  },
  {
    id: "crosshair",
    level: "Intermediate",
    title: "How confident are you with crosshair placement?",
    helper: "Think about head-level placement while clearing angles.",
    options: ["Beginner", "Inconsistent", "Usually good", "Very confident"],
  },
  {
    id: "warmup",
    level: "Intermediate",
    title: "How often do you warm up before ranked?",
    helper: "Range, Deathmatch, or an aim trainer all count.",
    options: ["Never", "Sometimes", "Most sessions", "Every session"],
  },
  {
    id: "aim-problem",
    level: "Intermediate",
    title: "Which aiming problem affects you most?",
    helper: "Choose the issue that loses you the most gunfights.",
    options: ["Flicking", "Tracking", "Micro-adjustments", "Recoil control", "First-bullet accuracy", "I am not sure"],
  },
  {
    id: "map-knowledge",
    level: "Intermediate",
    title: "How would you rate your map knowledge?",
    helper: "Include common angles, rotations, callouts, and safe routes.",
    options: ["Poor", "Basic", "Good", "Advanced"],
  },
  {
    id: "utility",
    level: "Intermediate",
    title: "How confidently do you use utility with your team?",
    helper: "Good utility should create space or support a clear plan.",
    options: ["I often forget it", "I use it reactively", "I usually use it well", "I actively coordinate combos"],
  },
  {
    id: "gunfight-loss",
    level: "Advanced",
    title: "What usually causes you to lose gunfights?",
    helper: "Pick the pattern you notice most often.",
    options: ["Bad crosshair placement", "Poor peeking", "Bad positioning", "Panic spraying", "Taking uneven fights", "Slow reactions"],
  },
  {
    id: "communication",
    level: "Advanced",
    title: "How consistently do you communicate useful information?",
    helper: "Useful calls are short, calm, accurate, and timely.",
    options: ["Rarely", "Sometimes", "Often", "Every round"],
  },
  {
    id: "economy",
    level: "Advanced",
    title: "How well do you understand team economy?",
    helper: "Consider save rounds, bonus rounds, force buys, and ult economy.",
    options: ["Beginner", "I know the basics", "Good", "Advanced"],
  },
  {
    id: "clutch",
    level: "Advanced",
    title: "What is your biggest problem in clutch situations?",
    helper: "Choose what breaks down most when you are the last player alive.",
    options: ["Panic", "Time management", "Positioning", "Utility usage", "Decision-making", "I avoid taking initiative"],
  },
  {
    id: "goal",
    level: "Goal",
    title: "What is your main goal for the next 7 days?",
    helper: "Your final plan will prioritize this outcome.",
    options: ["Rank up", "Improve aim", "Build better game sense", "Master my role / agent", "Become more consistent", "Improve team play"],
  },
];

export default function ValorantImprovePage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const question = QUESTIONS[current];
  const selected = answers[question?.id];
  const progress = Math.round(((current + (selected ? 1 : 0)) / QUESTIONS.length) * 100);

  const focusAreas = useMemo(() => {
    const areas = [answers.weakness, answers["aim-problem"], answers.clutch].filter(Boolean);
    return Array.from(new Set(areas)).slice(0, 3);
  }, [answers]);

  function choose(option: string) {
    setAnswers((previous) => ({ ...previous, [question.id]: option }));
  }

  function next() {
    if (!selected) return;
    if (current === QUESTIONS.length - 1) {
      try {
        localStorage.setItem("playdex-valorant-assessment", JSON.stringify(answers));
      } catch {
        // The result still works if browser storage is unavailable.
      }
      setCompleted(true);
      return;
    }
    setCurrent((value) => value + 1);
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
        <Link href="/games/valorant" className="transition hover:text-white">Valorant</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300">Improve</span>
      </nav>

      {!started ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-300">Valorant improvement planner</p>
              <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">Find exactly what is holding back your rank.</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">Complete a 15-question assessment covering fundamentals, mechanics, game sense, and high-pressure decisions. Playdex will turn your answers into a focused training profile.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => setStarted(true)} className="rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:brightness-110">Start assessment</button>
                <span className="text-xs text-zinc-500">15 questions · about 3 minutes</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {["5 basic profile questions", "5 mechanics & knowledge questions", "4 advanced decision questions", "1 clear seven-day goal"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-500/15 text-sm font-semibold text-rose-200">{index + 1}</span>
                  <p className="text-sm text-zinc-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : completed ? (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 bg-gradient-to-r from-rose-500/15 to-orange-400/10 p-6 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">Assessment complete</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Your Valorant training profile is ready.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">You are a {answers.rank} {answers.role} with a primary goal to {answers.goal?.toLowerCase()}.</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-9">
            <ResultCard label="Daily practice" value={answers["daily-time"]} />
            <ResultCard label="Main weakness" value={answers.weakness} />
            <ResultCard label="Warm-up habit" value={answers.warmup} />
            <ResultCard label="Map knowledge" value={answers["map-knowledge"]} />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recommended focus</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focusAreas.map((area) => <span key={area} className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100">{area}</span>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/10 p-6 sm:px-9">
            <Link href="/games/valorant/improve/plan" className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400">Build my 7-day plan</Link>
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
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">{question.level}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{question.title}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{question.helper}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const active = selected === option;
                return (
                  <button key={option} type="button" onClick={() => choose(option)} className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${active ? "border-rose-400/60 bg-rose-500/15 text-white ring-1 ring-rose-400/20" : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"}`}>
                    <span>{option}</span>
                    <span className={`ml-3 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-rose-300 bg-rose-400 text-[11px] text-white" : "border-zinc-700"}`}>{active ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 p-5 sm:px-8">
            <button type="button" onClick={() => current === 0 ? setStarted(false) : setCurrent((value) => value - 1)} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white">Back</button>
            <button type="button" onClick={next} disabled={!selected} className="rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">{current === QUESTIONS.length - 1 ? "Finish assessment" : "Next question"}</button>
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
