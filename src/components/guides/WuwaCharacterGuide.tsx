"use client";

import Link from "next/link";
import { useState } from "react";
import type { BuildComparison, BuildComparisonEntryRow, WuwaGuide, WuwaRecommendation, WuwaTeam } from "@/lib/guides/build-comparison-types";
import type { GuideTeamCalculation } from "@/lib/guides/team-calculation-types";

const percent = (value: number) => `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const calcNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });
const abilityNames: Record<string, string> = {
  basic_attack: "Basic Attack",
  resonance_skill: "Resonance Skill",
  resonance_liberation: "Resonance Liberation",
  inherent_skill: "Inherent Skill",
  intro_skill: "Intro Skill",
  forte_circuit: "Forte Circuit",
  outro_skill: "Outro Skill",
  tune_break: "Tune Break",
};
const KIT_TYPE_ORDER: Record<string, number> = {
  basic_attack: 0,
  resonance_skill: 1,
  resonance_liberation: 2,
  inherent_skill: 3,
  intro_skill: 4,
  forte_circuit: 5,
  outro_skill: 6,
  tune_break: 7,
};

function abilityTypeLabel(type: string) {
  return abilityNames[type] ?? type.replaceAll("_", " ");
}

function chainLabel(sortOrder: number, index: number) {
  return sortOrder >= 101 && sortOrder <= 199 ? `RC${sortOrder - 100}` : `RC${index + 1}`;
}

function metric(value: number | null, divisor: number, suffix: string) {
  return value === null ? "—" : `${calcNumber.format(value / divisor)}${suffix}`;
}

function Segments({ values, value, onChange, label }: { values: string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-white/10">
    {values.map(item => <button type="button" role="tab" aria-selected={item === value} key={item} onClick={() => onChange(item)}
      className={`border-b-2 px-3 py-2 text-sm ${item === value ? "border-teal-300 text-white" : "border-transparent text-zinc-400 hover:text-white"}`}>{item}</button>)}
  </div>;
}

export function WuwaCharacterGuide({ character }: { character: WuwaGuide }) {
  const [tab, setTab] = useState("Kit");
  const kitAbilities = character.abilities
    .filter((ability) => ability.ability_type !== "resonance_chain")
    .sort((a, b) => a.sort_order - b.sort_order || (KIT_TYPE_ORDER[a.ability_type] ?? 99) - (KIT_TYPE_ORDER[b.ability_type] ?? 99));
  const resonanceChains = character.abilities
    .filter((ability) => ability.ability_type === "resonance_chain")
    .sort((a, b) => a.sort_order - b.sort_order);

  return <div className="min-w-0 space-y-6">
    <nav className="text-sm text-zinc-400"><Link href="/games/wuthering-waves" className="hover:text-white">Wuthering Waves</Link><span className="mx-2">/</span>{character.name}</nav>
    <header className="flex items-center gap-5 border-b border-white/10 pb-5">
      {character.portrait_url && <img src={character.portrait_url} alt="" className="h-24 w-24 shrink-0 object-contain" />}
      <div className="min-w-0"><p className="text-sm capitalize text-teal-200">{character.element} · {character.weapon_type} · {character.rarity}-Star</p>
        <h1 className="mt-2 break-words text-2xl font-semibold text-white">{character.name}</h1></div>
    </header>
    <Segments label="Character guide" values={["Kit", "Resonance Chain", "Teams", "Build Guide"]} value={tab} onChange={setTab} />
    {tab === "Kit" ? <AbilityList
      items={kitAbilities.map((ability) => ({
        id: ability.id,
        label: abilityTypeLabel(ability.ability_type),
        name: ability.name,
        description: ability.description,
      }))}
      empty="Kit coming soon."
    /> : tab === "Resonance Chain" ? <AbilityList
      items={resonanceChains.map((ability, index) => ({
        id: ability.id,
        label: chainLabel(ability.sort_order, index),
        name: ability.name,
        description: ability.description,
      }))}
      empty="Resonance Chain coming soon."
    /> : tab === "Teams" ? <TeamsTab teams={character.teams} /> : <div className="space-y-8">
      {character.writtenNotes.map((note,i) => <p key={i} className="whitespace-pre-line text-sm leading-7 text-zinc-300">{note}</p>)}
      <EquipmentSection title="Weapons" recommendations={character.weapons} comparisons={character.comparisons.filter(c => c.comparison_type === "weapon")} emptyComparison="Weapon comparisons coming soon." emptyRecommendations="Weapon recommendations coming soon." />
      <EquipmentSection title="Echoes" recommendations={character.sets} comparisons={character.comparisons.filter(c => c.comparison_type === "echo_setup")} emptyComparison="Echo comparisons coming soon." emptyRecommendations="Echo recommendations coming soon." />
      <section className="space-y-4"><h2 className="text-lg font-semibold text-white">Sequence Comparison</h2>
        <ComparisonGroup comparisons={character.comparisons.filter(c => c.comparison_type === "sequence")} emptyLabel="Sequence comparisons coming soon." />
      </section>
    </div>}
  </div>;
}

function AbilityList({ items, empty }: { items: Array<{ id: string; label: string; name: string; description: string }>; empty: string }) {
  if (!items.length) return <p className="py-6 text-sm text-zinc-400">{empty}</p>;
  return <div className="divide-y divide-white/10">
    {items.map((item) => <details key={item.id} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-teal-300/80">{item.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{item.name}</p>
        </div>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-180">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </summary>
      <p className="max-w-4xl pb-3 text-sm leading-7 text-zinc-300 whitespace-pre-line">{item.description}</p>
    </details>)}
  </div>;
}

function TeamsTab({ teams }: { teams: WuwaTeam[] }) {
  if (!teams.length) return <p className="py-6 text-sm text-zinc-400">Team recommendations coming soon.</p>;
  return <div className="space-y-4">
    {teams.map((team) => <article key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{team.name}</h3>
        {team.type ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">{team.type}</p> : null}
        {team.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{team.description}</p> : null}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {team.members.map((member, index) => <div key={`${team.id}-${member.characterId ?? member.name}-${index}`} className="min-w-0 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.04]">
            {member.portraitUrl ? <img src={member.portraitUrl} alt="" className="h-full w-full object-contain" /> : <span className="text-[10px] text-zinc-500">{member.name.slice(0, 2)}</span>}
          </div>
          <p className="mt-2 truncate text-xs font-medium text-white">{member.name}</p>
          {member.role ? <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-zinc-500">{member.role}</p> : null}
        </div>)}
      </div>
      <details className="group mt-4 border-t border-white/10 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-teal-100 [&::-webkit-details-marker]:hidden">
          Team Calculation
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-zinc-500 transition group-open:rotate-180">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </summary>
        <div className="pt-3">
          {team.calculation ? <TeamCalculationDetails calculation={team.calculation} /> : <p className="text-sm text-zinc-400">Team calculations coming soon.</p>}
        </div>
      </details>
    </article>)}
  </div>;
}

function TeamCalculationDetails({ calculation }: { calculation: GuideTeamCalculation }) {
  return <div className="space-y-4">
    <dl className="grid grid-cols-3 gap-3">
      {[["Team DPS", metric(calculation.team_dps, 1000, "K")], ["DPR", metric(calculation.dpr, 1_000_000, "M")], ["Rotation", metric(calculation.rotation_seconds, 1, "s")]].map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-white">{value}</dd>
        </div>
      ))}
    </dl>
    <div className="space-y-2">
      {calculation.members.map((member) => <div key={`${calculation.id}-${member.slot}`} className="flex items-baseline justify-between gap-3 text-sm">
        <p className="truncate text-zinc-200">{member.character_name}{member.role ? <span className="ml-2 text-[11px] uppercase tracking-wide text-zinc-500">{member.role}</span> : null}</p>
        <p className="tabular-nums text-zinc-300">{member.damage_share == null ? "—" : `${member.damage_share}%`}</p>
      </div>)}
    </div>
    {calculation.note ? <p className="whitespace-pre-line text-sm leading-6 text-zinc-400">{calculation.note}</p> : null}
  </div>;
}

function EquipmentSection({ title, recommendations, comparisons, emptyComparison, emptyRecommendations }: { title: string; recommendations: WuwaRecommendation[]; comparisons: BuildComparison[]; emptyComparison: string; emptyRecommendations: string }) {
  const [view, setView] = useState(comparisons.length ? "Comparison" : "Recommended");
  return <section className="min-w-0 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <Segments label={`${title} view`} values={["Recommended", "Comparison"]} value={view} onChange={setView} />
  </div>
    {view === "Comparison" ? <ComparisonGroup comparisons={comparisons} emptyLabel={emptyComparison} /> : recommendations.length ? <div className="divide-y divide-white/10">
      {recommendations.map((r,i) => <div key={`${r.id}-${i}`} className="flex items-center gap-4 py-4">
        {r.icon_url && <img src={r.icon_url} alt="" className="h-16 w-16 shrink-0 object-contain" loading="lazy" />}
        <div><h3 className="text-sm font-semibold text-white">{r.pieces ? `${r.pieces}pc ` : ""}{r.name}</h3>{r.note && <p className="mt-2 text-sm text-zinc-400">{r.note}</p>}</div>
      </div>)}
    </div> : <p className="text-sm text-zinc-500">{emptyRecommendations}</p>}
  </section>;
}

function ComparisonGroup({ comparisons, emptyLabel }: { comparisons: BuildComparison[]; emptyLabel: string }) {
  const [selected, setSelected] = useState(comparisons[0]?.id ?? "");
  const [basis, setBasis] = useState("vs S0");
  const comparison = comparisons.find(c => c.id === selected) ?? comparisons[0];
  if (!comparison) return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  const sequence = comparison.comparison_type === "sequence";
  const best = Math.max(0, ...comparison.entries.map(e => e.damage ?? 0));
  const ratio = (e: BuildComparisonEntryRow) => sequence ? (basis === "vs S0" ? e.details.relative_to_s0 : e.details.relative_to_previous) ?? null : best && e.damage != null ? e.damage / best : null;
  const maxRatio = Math.max(1, ...comparison.entries.map(e => ratio(e) ?? 0));
  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      {comparisons.length > 1 && <select aria-label="Calculation context" value={comparison.id} onChange={e => setSelected(e.target.value)}
        className="w-full min-w-0 max-w-xl rounded-md border border-white/15 bg-zinc-900 p-2 text-sm text-zinc-200">
        {comparisons.map(c => <option key={c.id} value={c.id}>{c.metadata.sheet} · {c.metadata.context} · {c.title}</option>)}
      </select>}
      {sequence && <Segments label="Sequence comparison basis" values={["vs S0", "vs Previous"]} value={basis} onChange={setBasis} />}
      <span className="text-xs text-zinc-400">{comparison.source_version}</span>
    </div>
    <div className={comparison.comparison_type === "echo_setup" ? "grid gap-3 lg:grid-cols-2" : "space-y-3"}>
      {comparison.entries.map(e => {
        const value = ratio(e);
        const gain = e.details.relative_to_previous == null ? null : e.details.relative_to_previous - 1;
        const d = e.details;
        return <article key={e.id} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center gap-4">
            {d.icon_url && <img src={d.icon_url} alt={e.label} className="h-16 w-16 shrink-0 object-contain" loading="lazy" />}
            <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold text-white">{e.label}{!sequence && d.rank ? ` R${d.rank}` : ""}</h3>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1"><strong className="text-xl tabular-nums text-teal-200">{value == null ? "—" : percent(value)}</strong>
                {sequence && gain != null && d.sequence !== 0 && <span className="text-sm tabular-nums text-amber-200">{gain >= 0 ? "+" : ""}{percent(gain)}</span>}
                {e.damage != null && <span className="text-xs tabular-nums text-zinc-500">{number.format(e.damage)} DPR</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded bg-white/5" role="meter" aria-label={`${e.label} relative performance`} aria-valuenow={value == null ? 0 : value * 100} aria-valuemin={0} aria-valuemax={maxRatio * 100}>
            <div className="h-full bg-teal-300/75" style={{ width: `${Math.max(0, (value ?? 0) / maxRatio * 100)}%` }} />
          </div>
          {comparison.comparison_type === "echo_setup" && <div className="mt-4 space-y-3 text-sm">
            {!!d.cost_pattern?.length && <div><p className="mb-2 text-xs text-zinc-500">Echo cost / Main stat</p><div className="grid grid-cols-5 gap-1">
              {d.cost_pattern.map((cost,i) => <div key={i} className="min-w-0 border-l border-white/10 px-1 text-center"><strong className="text-base text-white">{cost}</strong>
                <p className="mt-1 break-words text-[11px] text-zinc-400">{d.main_stats?.[i] ?? "—"}</p></div>)}
            </div></div>}
            {!d.cost_pattern?.length && !!d.stated_main_stats?.length && <p className="text-zinc-300">{d.stated_main_stats.join(" / ")}</p>}
            {!!d.secondary_sets?.length && <div><p className="text-xs text-zinc-500">Secondary set{d.secondary_sets.length > 1 ? " alternatives" : ""}</p>
              <p className="mt-1 text-zinc-200">{d.secondary_sets.map(s => `${s.pieces}pc ${s.name}`).join(" or ")}</p></div>}
            {d.main_echo && <div className="flex items-center gap-2">{d.main_echo.icon_url && <img src={d.main_echo.icon_url} alt="" className="h-9 w-9 object-contain" loading="lazy" />}<div><p className="text-xs text-zinc-500">Main Echo</p><p className="text-zinc-200">{d.main_echo.name}</p></div></div>}
          </div>}
          {d.variant_note && <p className="mt-3 break-words text-xs text-zinc-400">{d.variant_note}</p>}
          {!!d.markers?.length && <span className="mt-2 block text-xs text-amber-200">{d.markers.join(" ")}</span>}
        </article>;
      })}
    </div>
    <details className="border-t border-white/10 pt-3 text-xs text-zinc-400"><summary className="cursor-pointer text-sm">Calculation assumptions</summary>
      <div className="mt-3 space-y-2"><p>{comparison.title}</p><p>{comparison.metadata.context}</p><p>{comparison.metadata.sheet_title}</p>
        {[...new Set(comparison.metadata.notes)].map((note,i) => <p key={i} className="whitespace-pre-line leading-6">{note}</p>)}
      </div>
    </details>
  </div>;
}
