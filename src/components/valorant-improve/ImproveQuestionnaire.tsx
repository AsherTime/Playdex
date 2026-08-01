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
  CONSISTENCY_OPTIONS,
  IMPROVE_GOALS,
  LOST_ROUND_CAUSES,
  MATCHES_PER_DAY,
  PRACTICE_METHODS,
  PRACTICE_TIMES,
  VALORANT_RANKS,
  VALORANT_ROLES,
  VALORANT_WEAKNESSES,
  VALORANT_WEAPONS,
} from "@/types/valorant-improve";

const TOTAL_STEPS = 12;

const DEFAULT_FORM: ImproveQuestionnaire = {
  rank: "Gold",
  role: "Duelist",
  agents: [],
  weaknesses: [],
  bestWeapon: "Vandal",
  lostRoundCause: "Losing aim duels",
  matchesPerDay: "2",
  practiceTime: "30 minutes",
  practiceMethod: "Deathmatch",
  dpi: 800,
  sensitivity: 0.35,
  scopedSensitivity: 1,
  goal: "Reach the next rank",
  consistency: "Most days",
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
        return {
          ...current,
          weaknesses: current.weaknesses.filter((item) => item !== weakness),
        };
      }
      if (current.weaknesses.length >= 3) return current;
      return { ...current, weaknesses: [...current.weaknesses, weakness] };
    });
  };

  const toggleAgent = (agentId: string) => {
    setForm((current) => {
      const exists = current.agents.includes(agentId);
      return {
        ...current,
        agents: exists
          ? current.agents.filter((id) => id !== agentId)
          : [...current.agents, agentId],
      };
    });
  };

  const canContinue = () => {
    if (step === 3) return form.agents.length > 0;
    if (step === 4) return form.weaknesses.length > 0;
    if (step === 10) return form.dpi > 0 && form.sensitivity > 0;
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
    router.push("/games/valorant/improve/plan");
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={progress} label={`Questionnaire progress · Step ${step} of ${TOTAL_STEPS}`} />

      {step === 1 ? (
        <QuestionShell
          step={1}
          title="What is your current rank?"
          description="We use this to calibrate the difficulty of your routines."
        >
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

      {step === 2 ? (
        <QuestionShell
          step={2}
          title="What is your main role?"
          description="Your plan will lean toward the responsibilities of this role."
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
        </QuestionShell>
      ) : null}

      {step === 3 ? (
        <QuestionShell
          step={3}
          title="Which agents do you play most?"
          description="Select all agents you regularly queue with."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
          title="What are your biggest weaknesses?"
          description="Choose up to 3 areas you want the plan to target first."
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
        <QuestionShell step={5} title="What is your best weapon?" description="Helps tune aim drills.">
          <div className="flex flex-wrap gap-2">
            {VALORANT_WEAPONS.map((weapon) => (
              <OptionChip
                key={weapon}
                label={weapon}
                selected={form.bestWeapon === weapon}
                onClick={() => setForm((current) => ({ ...current, bestWeapon: weapon }))}
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 6 ? (
        <QuestionShell
          step={6}
          title="What usually causes lost rounds?"
          description="We add focused tasks to address your most common round losses."
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

      {step === 7 ? (
        <QuestionShell
          step={7}
          title="How many competitive matches do you play per day?"
          description="Used to size your ranked goals."
        >
          <div className="flex flex-wrap gap-2">
            {MATCHES_PER_DAY.map((value) => (
              <OptionChip
                key={value}
                label={value}
                selected={form.matchesPerDay === value}
                onClick={() => setForm((current) => ({ ...current, matchesPerDay: value }))}
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 8 ? (
        <QuestionShell
          step={8}
          title="How much practice time can you commit daily?"
          description="Your routine length is built around this time budget."
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

      {step === 9 ? (
        <QuestionShell
          step={9}
          title="What is your current practice method?"
          description="We reference this in your warm-up task wording."
        >
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
        </QuestionShell>
      ) : null}

      {step === 10 ? (
        <QuestionShell
          step={10}
          title="What is your sensitivity setup?"
          description="Saved for future aim routine personalization."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">DPI</span>
              <input
                type="number"
                min={100}
                value={form.dpi}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dpi: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-rose-400/40 focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                In-game sensitivity
              </span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={form.sensitivity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sensitivity: Number(event.target.value) || 0,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-rose-400/40 focus:outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Scoped sensitivity (optional)
              </span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={form.scopedSensitivity ?? 1}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scopedSensitivity: Number(event.target.value) || undefined,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-rose-400/40 focus:outline-none"
              />
            </label>
          </div>
        </QuestionShell>
      ) : null}

      {step === 11 ? (
        <QuestionShell
          step={11}
          title="What is your biggest goal right now?"
          description="Your ranked focus tasks will align with this goal."
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

      {step === 12 ? (
        <QuestionShell
          step={12}
          title="How consistent can you practice?"
          description="Helps set expectations for your weekly rhythm."
        >
          <div className="flex flex-wrap gap-2">
            {CONSISTENCY_OPTIONS.map((option) => (
              <OptionChip
                key={option}
                label={option}
                selected={form.consistency === option}
                onClick={() => setForm((current) => ({ ...current, consistency: option }))}
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
          {step === TOTAL_STEPS ? "Generate my plan" : "Continue"}
        </button>
      </div>
    </div>
  );
}
