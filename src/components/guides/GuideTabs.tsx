"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { EquipmentDetailsPanel } from "@/components/guides/EquipmentDetailsPanel";
import { MissingAssetIcon } from "@/components/guides/MissingAssetIcon";
import type { GuideCharacterDetail } from "@/lib/guides/genshin";
import { TeamCalculations } from "@/components/guides/TeamCalculations";

type TabId = "kit" | "build" | "teams";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "kit", label: "Kit" },
  { id: "build", label: "Build Guide" },
  { id: "teams", label: "Teams" },
];

export function GuideTabs({ character }: { character: GuideCharacterDetail }) {
  const [activeTab, setActiveTab] = useState<TabId>("kit");

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-indigo-300 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "kit" ? <KitTab character={character} /> : null}
      {activeTab === "build" ? <BuildTab character={character} /> : null}
      {activeTab === "teams" ? <TeamsSection character={character} /> : null}
    </section>
  );
}

function TeamsSection({ character }: { character: GuideCharacterDetail }) {
  const [section, setSection] = useState<"guide" | "calculations">("guide");
  return (
    <div className="space-y-4">
      <div className="flex gap-2" aria-label="Team sections">
        {([ ["guide", "Team Guide"], ["calculations", "Team Calculations"] ] as const).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${section === id ? "border-indigo-300/40 bg-indigo-400/10 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {section === "guide" ? <TeamsTab character={character} /> : <TeamCalculations calculations={character.calculations} />}
    </div>
  );
}

function KitTab({ character }: { character: GuideCharacterDetail }) {
  const kit = character.kit;
  if (!kit) return <UnavailableState label="Kit data unavailable." />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <TalentSection title="Normal Attack" talent={kit.normalAttack} />
        <TalentSection title="Elemental Skill" talent={kit.elementalSkill} />
        <TalentSection title="Elemental Burst" talent={kit.elementalBurst} />
      </div>

      {kit.passiveTalents.length ? (
        <GuidePanel title="Passive Talents">
          <div className="grid gap-3 md:grid-cols-2">
            {kit.passiveTalents.map((talent) => (
              <MiniTextCard key={talent.id} title={talent.name} body={talent.description} />
            ))}
          </div>
        </GuidePanel>
      ) : null}

      {kit.constellations.length ? (
        <GuidePanel title="Constellations">
          <div className="grid gap-2 md:grid-cols-2">
            {kit.constellations.map((constellation, index) => (
              <div key={constellation.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-semibold text-indigo-100">
                    C{index + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{constellation.name}</h4>
                </div>
                <p className="whitespace-pre-line text-xs leading-5 text-zinc-400">
                  {constellation.description}
                </p>
              </div>
            ))}
          </div>
        </GuidePanel>
      ) : null}

      {kit.ruleTerms.length ? (
        <GuidePanel title="Rule Terms">
          <div className="flex flex-wrap gap-2">
            {kit.ruleTerms.map((term) => (
              <span
                key={term.term}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300"
              >
                {term.term}
              </span>
            ))}
          </div>
        </GuidePanel>
      ) : null}
    </div>
  );
}

function BuildTab({ character }: { character: GuideCharacterDetail }) {
  const build = character.build;
  if (!build) return <UnavailableState label="Build guide data unavailable." />;

  return (
    <div className="space-y-4">
      <GuidePanel title="Best Weapons">
        <RankingList
          items={[...build.bestWeapons, ...build.alternativeWeapons, ...build.f2pWeapons]}
          expandableDescriptions
        />
      </GuidePanel>

      {build.bestArtifacts.length || build.alternativeArtifacts.length ? (
        <GuidePanel title="Best Artifacts">
          <RankingList
            items={[...build.bestArtifacts, ...build.alternativeArtifacts]}
            compact
            expandableDescriptions
          />
        </GuidePanel>
      ) : null}

      {build.mainStats || build.substatPriority.length ? (
        <GuidePanel title="Artifact Stats">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            {build.mainStats ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <h4 className="text-sm font-semibold text-white">Main Stats</h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <StatLine label="Sands" value={build.mainStats.sand} />
                  <StatLine label="Goblet" value={build.mainStats.goblet} />
                  <StatLine label="Circlet" value={build.mainStats.circlet} />
                  {build.mainStats.raw ? <StatLine label="Notes" value={build.mainStats.raw} /> : null}
                </dl>
              </div>
            ) : null}

            {build.substatPriority.length ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <h4 className="text-sm font-semibold text-white">Substat Priority</h4>
                <PriorityTrail items={build.substatPriority} />
              </div>
            ) : null}
          </div>
        </GuidePanel>
      ) : null}

      {build.energyRecharge ? (
        <GuidePanel title="Recommended Stat Targets">
          <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-zinc-300">
            {build.energyRecharge}
          </p>
        </GuidePanel>
      ) : null}

      {build.talentPriority.length ? (
        <GuidePanel title="Talent Priority">
          <PriorityTrail items={build.talentPriority} />
        </GuidePanel>
      ) : null}

      {build.rotationPlaystyle || build.rotation.length ? (
        <GuidePanel title="Rotation & Playstyle">
          {build.rotationPlaystyle ? (
            <p className="whitespace-pre-line rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-zinc-300">
              {build.rotationPlaystyle}
            </p>
          ) : (
          <ol className="space-y-2">
            {build.rotation.map((step) => (
              <li key={`${step.step}-${step.text}`} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-400/10 text-xs font-semibold text-indigo-100">
                  {step.step}
                </span>
                <span className="text-sm leading-6 text-zinc-300">{step.text}</span>
              </li>
            ))}
          </ol>
          )}
        </GuidePanel>
      ) : null}
    </div>
  );
}

function TeamsTab({ character }: { character: GuideCharacterDetail }) {
  if (!character.teams.length) return <UnavailableState label="Team data unavailable." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {character.teams.map((team) => (
        <article key={team.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">{team.name}</h3>
            {team.type ? <p className="mt-0.5 text-xs text-zinc-500">{team.type}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {team.members.map((member) => (
              <div key={`${team.id}-${member.slotNumber}`} className="rounded-lg border border-white/10 bg-black/25 p-2">
                <div
                  className="relative mx-auto h-14 w-14 overflow-hidden rounded-lg bg-white/5"
                  style={{ width: 56, height: 56 }}
                >
                  {member.iconPath ? (
                    <Image
                      src={member.iconPath}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain object-bottom p-1"
                    />
                  ) : (
                    <MissingAssetIcon label={member.characterName} />
                  )}
                </div>
                <p className="mt-2 truncate text-center text-xs font-medium text-white">
                  {member.characterName}
                </p>
                {member.role ? (
                  <p className="mt-0.5 truncate text-center text-[10px] uppercase tracking-wide text-zinc-500">
                    {member.role}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function TalentSection({
  title,
  talent,
}: {
  title: string;
  talent: NonNullable<GuideCharacterDetail["kit"]>["normalAttack"];
}) {
  if (!talent) return null;
  return (
    <GuidePanel title={title}>
      <h3 className="text-sm font-semibold text-white">{talent.name}</h3>
      <p className="mt-2 max-h-[420px] overflow-auto whitespace-pre-line pr-1 text-xs leading-5 text-zinc-400">
        {talent.description}
      </p>
    </GuidePanel>
  );
}

function RankingList({
  items,
  compact = false,
  expandableDescriptions = false,
}: {
  items: NonNullable<GuideCharacterDetail["build"]>["bestWeapons"];
  compact?: boolean;
  expandableDescriptions?: boolean;
}) {
  if (!items.length) return <UnavailableState label="Guide data unavailable." compact />;

  return (
    <ol className={`grid gap-2 ${compact ? "md:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <li key={`${item.rank}-${item.name}`} className="rounded-xl border border-white/10 bg-black/20 p-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-zinc-300">
              {item.rank}
            </span>
            <div
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5"
              style={{ width: 40, height: 40 }}
            >
              {item.iconPath ? (
                <Image
                  src={item.iconPath}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              ) : (
                <MissingAssetIcon label={item.name} />
              )}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{item.name}</span>
          </div>
          {item.canonical ? <EquipmentDetailsPanel canonical={item.canonical} /> : null}
          {expandableDescriptions && item.description ? (
            <details className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-zinc-400">
              <summary className="cursor-pointer text-zinc-300">Why use this</summary>
              <p className="mt-2 whitespace-pre-line">{item.description}</p>
            </details>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function PriorityTrail({
  items,
}: {
  items: NonNullable<GuideCharacterDetail["build"]>["talentPriority"];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <span key={`${item.rank}-${item.name}`} className="contents">
          <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-sm text-zinc-200">
            {item.name}
          </span>
          {index < items.length - 1 ? <span className="text-zinc-600">&gt;</span> : null}
        </span>
      ))}
    </div>
  );
}

function StatLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-200">{value}</dd>
    </div>
  );
}

function MiniTextCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="mt-2 whitespace-pre-line text-xs leading-5 text-zinc-400">{body}</p>
    </div>
  );
}

function GuidePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
      <h2 className="mb-3 text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function UnavailableState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <p
      className={`rounded-xl border border-dashed border-white/10 bg-black/20 text-center text-sm text-zinc-500 ${
        compact ? "px-3 py-4" : "px-4 py-10"
      }`}
    >
      {label}
    </p>
  );
}
