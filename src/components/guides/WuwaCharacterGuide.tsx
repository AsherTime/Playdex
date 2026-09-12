"use client";

import Link from "next/link";
import { useState } from "react";
import type { BuildComparison, BuildComparisonEntryRow, WuwaGuide, WuwaRecommendation } from "@/lib/guides/build-comparison-types";

const percent = (value: number) => `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const abilityNames: Record<string, string> = { basic_attack: "Basic Attack", resonance_skill: "Resonance Skill", resonance_liberation: "Resonance Liberation",
  forte_circuit: "Forte Circuit", intro_skill: "Intro Skill", outro_skill: "Outro Skill", inherent_skill: "Inherent Skill", resonance_chain: "Resonance Chain", tune_break: "Tune Break" };

function Segments({ values, value, onChange, label }: { values: string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-white/10">
    {values.map(item => <button type="button" role="tab" aria-selected={item === value} key={item} onClick={() => onChange(item)}
      className={`border-b-2 px-3 py-2 text-sm ${item === value ? "border-teal-300 text-white" : "border-transparent text-zinc-400 hover:text-white"}`}>{item}</button>)}
  </div>;
}

export function WuwaCharacterGuide({ character }: { character: WuwaGuide }) {
  const [tab, setTab] = useState("Kit");
  return <div className="min-w-0 space-y-6">
    <nav className="text-sm text-zinc-400"><Link href="/games/wuthering-waves" className="hover:text-white">Wuthering Waves</Link><span className="mx-2">/</span>{character.name}</nav>
    <header className="flex items-center gap-5 border-b border-white/10 pb-5">
      {character.portrait_url && <img src={character.portrait_url} alt="" className="h-24 w-24 shrink-0 object-contain" />}
      <div className="min-w-0"><p className="text-sm capitalize text-teal-200">{character.element} · {character.weapon_type} · {character.rarity}-Star</p>
        <h1 className="mt-2 break-words text-2xl font-semibold text-white">{character.name}</h1></div>
    </header>
    <Segments label="Character guide" values={["Kit", "Build Guide"]} value={tab} onChange={setTab} />
    {tab === "Kit" ? <div className="space-y-3">{character.abilities.map(a => <details key={a.id} className="border-b border-white/10 pb-3">
      <summary className="cursor-pointer py-2 text-sm text-white"><span className="mr-3 text-teal-200">{abilityNames[a.ability_type] ?? a.ability_type.replaceAll("_", " ")}</span>{a.name}</summary>
      <p className="max-w-4xl whitespace-pre-line py-3 text-sm leading-7 text-zinc-300">{a.description}</p>
    </details>)}</div> : <div className="space-y-8">
      {character.writtenNotes.map((note,i) => <p key={i} className="whitespace-pre-line text-sm leading-7 text-zinc-300">{note}</p>)}
      <EquipmentSection title="Weapons" recommendations={character.weapons} comparisons={character.comparisons.filter(c => c.comparison_type === "weapon")} />
      <EquipmentSection title="Echoes" recommendations={character.sets} comparisons={character.comparisons.filter(c => c.comparison_type === "echo_setup")} />
      <section className="space-y-4"><h2 className="text-lg font-semibold text-white">Sequence Comparison</h2>
        <ComparisonGroup comparisons={character.comparisons.filter(c => c.comparison_type === "sequence")} />
      </section>
    </div>}
  </div>;
}

function EquipmentSection({ title, recommendations, comparisons }: { title: string; recommendations: WuwaRecommendation[]; comparisons: BuildComparison[] }) {
  const [view, setView] = useState(comparisons.length ? "Comparison" : "Recommended");
  return <section className="min-w-0 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <Segments label={`${title} view`} values={["Recommended", "Comparison"]} value={view} onChange={setView} />
  </div>
    {view === "Comparison" ? <ComparisonGroup comparisons={comparisons} /> : recommendations.length ? <div className="divide-y divide-white/10">
      {recommendations.map((r,i) => <div key={`${r.id}-${i}`} className="flex items-center gap-4 py-4">
        {r.icon_url && <img src={r.icon_url} alt="" className="h-16 w-16 shrink-0 object-contain" loading="lazy" />}
        <div><h3 className="text-sm font-semibold text-white">{r.pieces ? `${r.pieces}pc ` : ""}{r.name}</h3>{r.note && <p className="mt-2 text-sm text-zinc-400">{r.note}</p>}</div>
      </div>)}
    </div> : <p className="text-sm text-zinc-500">No recommendations yet.</p>}
  </section>;
}

function ComparisonGroup({ comparisons }: { comparisons: BuildComparison[] }) {
  const [selected, setSelected] = useState(comparisons[0]?.id ?? "");
  const [basis, setBasis] = useState("vs S0");
  const comparison = comparisons.find(c => c.id === selected) ?? comparisons[0];
  if (!comparison) return <p className="text-sm text-zinc-500">No comparison available yet.</p>;
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
