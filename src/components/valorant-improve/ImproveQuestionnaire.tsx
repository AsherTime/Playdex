"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_ROLE_COLORS, VALORANT_AGENTS } from "@/data/valorant-agents";
import { generateImprovementPlan } from "@/lib/valorant-improve-plan";
import { savePlan, saveQuestionnaire } from "@/lib/valorant-improve-storage";
import { ImproveCard, ProgressBar } from "@/components/valorant-improve/ImproveShell";
import { RankBadge } from "@/components/valorant-improve/RankBadge";
import type {
  ImproveQuestionnaire,
  PracticeTime,
  ValorantRole,
  ValorantWeakness,
} from "@/types/valorant-improve";
import {
  IMPROVE_GOALS,
  LOST_ROUND_CAUSES,
  PRACTICE_METHODS,
  PRACTICE_TIMES,
  VALORANT_RANKS,
  VALORANT_ROLES,
  VALORANT_WEAKNESSES,
} from "@/types/valorant-improve";

const TOTAL_STEPS = 6;

const DEFAULT_FORM: ImproveQuestionnaire = {
  rank: "Gold",
  role: "Duelist",
  agents: [],
  weaknesses: [],
  lostRoundCause: "Losing aim duels",
  practiceTime: "45 min",
  practiceMethod: "Deathmatch",
  goal: "Rank Up",
};

function OptionChip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${
        selected
          ? "border-rose-400/40 bg-rose-500/20 text-rose-50"
          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {label}
    </button>
  );
}

function QuestionShell({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <ImproveCard className="p-5 sm:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose-300/75">
        Question {step} of {TOTAL_STEPS}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <div className="mt-5">{children}</div>
    </ImproveCard>
  );
}

export function ImproveQuestionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ImproveQuestionnaire>(DEFAULT_FORM);
  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  const toggleWeakness = (weakness: ValorantWeakness) => {
    setForm((current) => {
      const exists = current.weaknesses.includes(weakness);
      if (exists) {
        return { ...current, weaknesses: current.weaknesses.filter((item) => item !== weakness) };
      }
      if (current.weaknesses.length >= 3) return current;
      return { ...current, weaknesses: [...current.weaknesses, weakness] };
    });
  };

  const toggleAgent = (agentId: string) => {
    setForm((current) => ({
      ...current,
      agents: current.agents.includes(agentId)
        ? current.agents.filter((id) => id !== agentId)
        : [...current.agents, agentId],
    }));
  };

  const canContinue = () => {
    if (step === 3) return form.agents.length > 0;
    if (step === 4) return form.weaknesses.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }

    saveQuestionnaire(form);
    savePlan(generateImprovementPlan(form));
    router.push("/games/valorant/improve/dashboard");
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={progress} label={`Setup · Step ${step} of ${TOTAL_STEPS}`} />

      {step === 1 ? (
        <QuestionShell
          step={1}
          title="What is your primary goal?"
          description="Riot can read matches later. This is what you want the training to optimize for."
        >
          <div className="flex flex-wrap gap-2">
            {IMPROVE_GOALS.map((goal) => (
              <OptionChip
                key={goal}
                label={goal}
                selected={form.goal === goal}
                onClick={() => setForm((current) => ({ ...current, goal }))}
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 2 ? (
        <QuestionShell
          step={2}
          title="How much time can you train each day?"
          description="Today's plan is sized to this budget."
        >
          <div className="flex flex-wrap gap-2">
            {PRACTICE_TIMES.map((value) => (
              <OptionChip
                key={value}
                label={value}
                selected={form.practiceTime === value}
                onClick={() =>
                  setForm((current) => ({ ...current, practiceTime: value as PracticeTime }))
                }
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 3 ? (
        <QuestionShell
          step={3}
          title="Preferred role and agents"
          description="Pick the role you want to climb on, then the agents you actually queue."
        >
          <div className="flex flex-wrap gap-2">
            {VALORANT_ROLES.map((role) => (
              <OptionChip
                key={role}
                label={role}
                selected={form.role === role}
                onClick={() => setForm((current) => ({ ...current, role: role as ValorantRole }))}
              />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {VALORANT_AGENTS.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => toggleAgent(agent.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  form.agents.includes(agent.id)
                    ? "border-rose-400/40 bg-rose-500/15 ring-1 ring-rose-400/30"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <p className="text-sm font-semibold text-white">{agent.name}</p>
                <p
                  className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${AGENT_ROLE_COLORS[agent.role]}`}
                >
                  {agent.role}
                </p>
              </button>
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 4 ? (
        <QuestionShell
          step={4}
          title="What do you feel you struggle with?"
          description="Riot will measure this later. Your read still matters for today's plan."
        >
          <div className="flex flex-wrap gap-2">
            {VALORANT_WEAKNESSES.map((weakness) => (
              <OptionChip
                key={weakness}
                label={weakness}
                selected={form.weaknesses.includes(weakness)}
                disabled={!form.weaknesses.includes(weakness) && form.weaknesses.length >= 3}
                onClick={() => toggleWeakness(weakness)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">{form.weaknesses.length}/3 selected</p>
        </QuestionShell>
      ) : null}

      {step === 5 ? (
        <QuestionShell
          step={5}
          title="What usually costs you the round?"
          description="The feeling after a lost round — not a tracker stat."
        >
          <div className="flex flex-wrap gap-2">
            {LOST_ROUND_CAUSES.map((cause) => (
              <OptionChip
                key={cause}
                label={cause}
                selected={form.lostRoundCause === cause}
                onClick={() => setForm((current) => ({ ...current, lostRoundCause: cause }))}
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 6 ? (
        <QuestionShell
          step={6}
          title="Warm-up method and current rank"
          description="Rank is self-reported until Riot is connected. Warm-up is how you like to start."
        >
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-500">Warm-up</p>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_METHODS.map((method) => (
              <OptionChip
                key={method}
                label={method}
                selected={form.practiceMethod === method}
                onClick={() => setForm((current) => ({ ...current, practiceMethod: method }))}
              />
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs uppercase tracking-[0.16em] text-zinc-500">
            Self-reported rank
          </p>
          <div className="flex flex-wrap gap-2">
            {VALORANT_RANKS.map((rank) => (
              <RankBadge
                key={rank}
                rank={rank}
                selected={form.rank === rank}
                onClick={() => setForm((current) => ({ ...current, rank }))}
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue()}
          className="rounded-full border border-rose-400/35 bg-rose-500/15 px-5 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === TOTAL_STEPS ? "Open my dashboard" : "Continue"}
        </button>
      </div>
    </div>
  );
}
