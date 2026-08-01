"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FREE_FIRE_CHARACTERS } from "@/data/free-fire-characters";
import { generateFreeFirePlan } from "@/lib/free-fire-improve-plan";
import {
  saveFreeFirePlan,
  saveFreeFireQuestionnaire,
} from "@/lib/free-fire-improve-storage";
import {
  FreeFireImproveCard,
  FreeFireProgressBar,
} from "@/components/free-fire-improve/FreeFireImproveShell";
import { FreeFireRankBadge } from "@/components/free-fire-improve/FreeFireRankBadge";
import type {
  FreeFirePracticeTime,
  FreeFireQuestionnaire,
  FreeFireRole,
  FreeFireWeakness,
} from "@/types/free-fire-improve";
import {
  FREE_FIRE_CONSISTENCY,
  FREE_FIRE_GOALS,
  FREE_FIRE_LOST_CAUSES,
  FREE_FIRE_MATCHES_PER_DAY,
  FREE_FIRE_PRACTICE_METHODS,
  FREE_FIRE_PRACTICE_TIMES,
  FREE_FIRE_RANKS,
  FREE_FIRE_ROLES,
  FREE_FIRE_WEAKNESSES,
  FREE_FIRE_WEAPON_TYPES,
} from "@/types/free-fire-improve";

const TOTAL_STEPS = 12;

const DEFAULT_FORM: FreeFireQuestionnaire = {
  rank: "Gold",
  role: "Rusher",
  characters: [],
  weaknesses: [],
  bestWeaponType: "Assault Rifle",
  lostRoundCause: "Losing aim duels",
  matchesPerDay: "2",
  practiceTime: "30 minutes",
  practiceMethod: "Training Ground",
  sensitivity: {
    general: 100,
    redDot: 90,
    scope2x: 85,
    scope4x: 80,
    sniperScope: 70,
    freeLook: 100,
  },
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
          ? "border-orange-400/40 bg-orange-500/20 text-orange-50"
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
    <FreeFireImproveCard className="p-5 sm:p-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-orange-300/75">
        Question {step} of {TOTAL_STEPS}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <div className="mt-5">{children}</div>
    </FreeFireImproveCard>
  );
}

export function FreeFireImproveQuestionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FreeFireQuestionnaire>(DEFAULT_FORM);

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  const toggleWeakness = (weakness: FreeFireWeakness) => {
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

  const toggleCharacter = (characterId: string) => {
    setForm((current) => {
      const exists = current.characters.includes(characterId);
      return {
        ...current,
        characters: exists
          ? current.characters.filter((id) => id !== characterId)
          : [...current.characters, characterId],
      };
    });
  };

  const canContinue = () => {
    if (step === 3) return form.characters.length > 0;
    if (step === 4) return form.weaknesses.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }

    saveFreeFireQuestionnaire(form);
    saveFreeFirePlan(generateFreeFirePlan(form));
    router.push("/games/free-fire/improve/plan");
  };

  return (
    <div className="space-y-4">
      <FreeFireProgressBar
        value={progress}
        label={`Questionnaire progress · Step ${step} of ${TOTAL_STEPS}`}
      />

      {step === 1 ? (
        <QuestionShell
          step={1}
          title="What is your current rank?"
          description="We use this to calibrate the difficulty of your routines."
        >
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_RANKS.map((rank) => (
              <FreeFireRankBadge
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
            {FREE_FIRE_ROLES.map((role) => (
              <OptionChip
                key={role}
                label={role}
                selected={form.role === role}
                onClick={() =>
                  setForm((current) => ({ ...current, role: role as FreeFireRole }))
                }
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 3 ? (
        <QuestionShell
          step={3}
          title="Which characters do you play most?"
          description="Select all characters you regularly queue with."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {FREE_FIRE_CHARACTERS.map((character) => (
              <button
                key={character.id}
                type="button"
                onClick={() => toggleCharacter(character.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  form.characters.includes(character.id)
                    ? "border-orange-400/40 bg-orange-500/15 ring-1 ring-orange-400/30"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <p className="text-sm font-semibold text-white">{character.name}</p>
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
            {FREE_FIRE_WEAKNESSES.map((weakness) => (
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
          title="What is your best weapon type?"
          description="Helps tune aim and spray drills."
        >
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_WEAPON_TYPES.map((weapon) => (
              <OptionChip
                key={weapon}
                label={weapon}
                selected={form.bestWeaponType === weapon}
                onClick={() => setForm((current) => ({ ...current, bestWeaponType: weapon }))}
              />
            ))}
          </div>
        </QuestionShell>
      ) : null}

      {step === 6 ? (
        <QuestionShell
          step={6}
          title="What usually causes lost rounds or matches?"
          description="We add focused tasks to address your most common losses."
        >
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_LOST_CAUSES.map((cause) => (
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
          title="How many ranked matches do you play per day?"
          description="Used to size your Clash Squad and BR focus goals."
        >
          <div className="flex flex-wrap gap-2">
            {FREE_FIRE_MATCHES_PER_DAY.map((value) => (
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
            {FREE_FIRE_PRACTICE_TIMES.map((value) => (
              <OptionChip
                key={value}
                label={value}
                selected={form.practiceTime === value}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    practiceTime: value as FreeFirePracticeTime,
                  }))
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
            {FREE_FIRE_PRACTICE_METHODS.map((method) => (
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
          title="What are your sensitivity settings?"
          description="Saved for future aim routine personalization."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["general", "General"],
                ["redDot", "Red Dot"],
                ["scope2x", "2x Scope"],
                ["scope4x", "4x Scope"],
                ["sniperScope", "Sniper Scope"],
                ["freeLook", "Free Look"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {label}
                </span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form.sensitivity[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sensitivity: {
                        ...current.sensitivity,
                        [key]: Number(event.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-orange-400/40 focus:outline-none"
                />
              </label>
            ))}
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
            {FREE_FIRE_GOALS.map((goal) => (
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
            {FREE_FIRE_CONSISTENCY.map((option) => (
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
          className="rounded-full border border-orange-400/35 bg-orange-500/15 px-5 py-2.5 text-sm font-medium text-orange-50 transition hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === TOTAL_STEPS ? "Generate my plan" : "Continue"}
        </button>
      </div>
    </div>
  );
}
