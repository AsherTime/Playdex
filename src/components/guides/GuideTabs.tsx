"use client";

import Image from "next/image";
import { useState } from "react";
import { EquipmentDetailsPanel } from "@/components/guides/EquipmentDetailsPanel";
import { GuideSectionTitle, GuideSurface } from "@/components/guides/guide-surfaces";
import { MissingAssetIcon } from "@/components/guides/MissingAssetIcon";
import { TeamCalculations } from "@/components/guides/TeamCalculations";
import type { GuideCharacterDetail } from "@/lib/guides/genshin";

type TabId = "kit" | "build" | "teams" | "calculations";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "kit", label: "Kit" },
  { id: "build", label: "Build" },
  { id: "teams", label: "Teams" },
  { id: "calculations", label: "Calculations" },
];

export function GuideTabs({ character }: { character: GuideCharacterDetail }) {
  const [activeTab, setActiveTab] = useState<TabId>("kit");

  return (
    <section className="space-y-5">
      <div className="sticky top-2 z-20 -mx-1 overflow-x-auto px-1 py-1">
        <div className="flex w-max min-w-full gap-1 rounded-full bg-[#0c0e16]/80 p-1 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.06] backdrop-blur-md">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white/[0.1] text-white"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "kit" ? <KitTab character={character} /> : null}
      {activeTab === "build" ? <BuildTab character={character} /> : null}
      {activeTab === "teams" ? <TeamsTab character={character} /> : null}
      {activeTab === "calculations" ? <TeamCalculations calculations={character.calculations} /> : null}
    </section>
  );
}

function KitTab({ character }: { character: GuideCharacterDetail }) {
  const kit = character.kit;
  if (!kit) return <UnavailableState label="Kit coming soon." />;

  return (
    <div className="space-y-5">
      <GuideSurface className="space-y-8">
        <TalentSection title="Normal Attack" talent={kit.normalAttack} />
        <TalentSection title="Elemental Skill" talent={kit.elementalSkill} />
        <TalentSection title="Elemental Burst" talent={kit.elementalBurst} />
      </GuideSurface>

      {kit.passiveTalents.length ? (
        <GuideSurface>
          <GuideSectionTitle>Passive Talents</GuideSectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            {kit.passiveTalents.map((talent) => (
              <MiniTextCard key={talent.id} title={talent.name} body={talent.description} />
            ))}
          </div>
        </GuideSurface>
      ) : null}

      {kit.constellations.length ? (
        <GuideSurface>
          <GuideSectionTitle>Constellations</GuideSectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {kit.constellations.map((constellation, index) => (
              <div key={constellation.id} className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold tabular-nums text-zinc-500">C{index + 1}</span>
                  <h4 className="text-sm font-semibold text-white">{constellation.name}</h4>
                </div>
                <p className="whitespace-pre-line text-sm leading-6 text-zinc-400">
                  {constellation.description}
                </p>
              </div>
            ))}
          </div>
        </GuideSurface>
      ) : null}

      {kit.ruleTerms.length ? (
        <GuideSurface>
          <GuideSectionTitle>Rule Terms</GuideSectionTitle>
          <div className="flex flex-wrap gap-2">
            {kit.ruleTerms.map((term) => (
              <span key={term.term} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-zinc-300">
                {term.term}
              </span>
            ))}
          </div>
        </GuideSurface>
      ) : null}
    </div>
  );
}

function BuildTab({ character }: { character: GuideCharacterDetail }) {
  const build = character.build;
  if (!build) return <UnavailableState label="Build guide coming soon." />;

  return (
    <div className="space-y-5">
      <GuideSurface>
        <GuideSectionTitle>Weapons</GuideSectionTitle>
        <RankingGroup label="Best" items={build.bestWeapons} />
        <RankingGroup label="Alternatives" items={build.alternativeWeapons} />
        <RankingGroup label="F2P" items={build.f2pWeapons} />
      </GuideSurface>

      {build.bestArtifacts.length || build.alternativeArtifacts.length ? (
        <GuideSurface>
          <GuideSectionTitle>Artifacts</GuideSectionTitle>
          <RankingGroup label="Best" items={build.bestArtifacts} compact />
          <RankingGroup label="Alternatives" items={build.alternativeArtifacts} compact />
        </GuideSurface>
      ) : null}

      {build.mainStats || build.substatPriority.length ? (
        <GuideSurface>
          <GuideSectionTitle>Artifact Stats</GuideSectionTitle>
          <div className="grid gap-6 md:grid-cols-2">
            {build.mainStats ? (
              <div>
                <h3 className="text-sm font-semibold text-white">Main stats</h3>
                <dl className="mt-3 space-y-2.5">
                  <StatLine label="Sands" value={build.mainStats.sand} />
                  <StatLine label="Goblet" value={build.mainStats.goblet} />
                  <StatLine label="Circlet" value={build.mainStats.circlet} />
                  {build.mainStats.raw ? <StatLine label="Notes" value={build.mainStats.raw} /> : null}
                </dl>
              </div>
            ) : null}

            {build.substatPriority.length ? (
              <div>
                <h3 className="text-sm font-semibold text-white">Substat priority</h3>
                <PriorityTrail items={build.substatPriority} />
              </div>
            ) : null}
          </div>
        </GuideSurface>
      ) : null}

      {build.energyRecharge ? (
        <GuideSurface>
          <GuideSectionTitle>Recommended Stat Targets</GuideSectionTitle>
          <p className="text-sm leading-6 text-zinc-300">{build.energyRecharge}</p>
        </GuideSurface>
      ) : null}

      {build.talentPriority.length ? (
        <GuideSurface>
          <GuideSectionTitle>Talent Priority</GuideSectionTitle>
          <PriorityTrail items={build.talentPriority} />
        </GuideSurface>
      ) : null}

      {build.rotationPlaystyle || build.rotation.length ? (
        <GuideSurface>
          <GuideSectionTitle>Rotation & Playstyle</GuideSectionTitle>
          {build.rotationPlaystyle ? (
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">{build.rotationPlaystyle}</p>
          ) : (
            <ol className="space-y-3">
              {build.rotation.map((step) => (
                <li key={`${step.step}-${step.text}`} className="flex gap-3">
                  <span className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-500">{step.step}</span>
                  <span className="text-sm leading-6 text-zinc-300">{step.text}</span>
                </li>
              ))}
            </ol>
          )}
        </GuideSurface>
      ) : null}
    </div>
  );
}

function TeamsTab({ character }: { character: GuideCharacterDetail }) {
  if (!character.teams.length) return <UnavailableState label="Team recommendations coming soon." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {character.teams.map((team) => (
        <article key={team.id} className="rounded-2xl bg-white/[0.04] p-4 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">{team.name}</h3>
            {team.type ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">{team.type}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {team.members.map((member) => (
              <div key={`${team.id}-${member.slotNumber}`} className="min-w-0 text-center">
                <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl bg-white/[0.04]">
                  {member.iconPath ? (
                    <Image
                      src={member.iconPath}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain object-bottom p-1"
                    />
                  ) : (
                    <MissingAssetIcon label={member.characterName} />
                  )}
                </div>
                <p className="mt-2 truncate text-xs font-medium text-white">{member.characterName}</p>
                {member.role ? (
                  <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-zinc-500">{member.role}</p>
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
    <div>
      <GuideSectionTitle>{title}</GuideSectionTitle>
      <h3 className="text-lg font-semibold text-white">{talent.name}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-400">{talent.description}</p>
    </div>
  );
}

function RankingGroup({
  label,
  items,
  compact = false,
}: {
  label: string;
  items: NonNullable<GuideCharacterDetail["build"]>["bestWeapons"];
  compact?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-3 text-xs font-medium text-zinc-500">{label}</p>
      <RankingList items={items} compact={compact} expandableDescriptions />
    </div>
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
  if (!items.length) return <UnavailableState label="Coming soon." compact />;

  return (
    <ol className={`grid gap-3 ${compact ? "md:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <li key={`${item.rank}-${item.name}`} className="rounded-xl bg-black/20 px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="w-5 text-center text-xs font-semibold tabular-nums text-zinc-500">{item.rank}</span>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
              {item.iconPath ? (
                <Image src={item.iconPath} alt="" fill sizes="48px" className="object-contain p-1" />
              ) : (
                <MissingAssetIcon label={item.name} />
              )}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{item.name}</span>
          </div>
          {item.canonical ? <EquipmentDetailsPanel canonical={item.canonical} /> : null}
          {expandableDescriptions && item.description ? (
            <details className="mt-2 text-sm leading-6 text-zinc-400">
              <summary className="cursor-pointer text-zinc-300 transition hover:text-white">Why use this</summary>
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
          <span className="text-sm text-zinc-200">{item.name}</span>
          {index < items.length - 1 ? <span className="text-zinc-600">→</span> : null}
        </span>
      ))}
    </div>
  );
}

function StatLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <dt className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-200">{value}</dd>
    </div>
  );
}

function MiniTextCard({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">{body}</p>
    </div>
  );
}

function UnavailableState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <p className={`text-center text-sm text-zinc-500 ${compact ? "py-4" : "py-10"}`}>{label}</p>
  );
}
