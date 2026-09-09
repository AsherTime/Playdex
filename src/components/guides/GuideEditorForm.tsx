"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { saveGuideDraftAction, submitGuideRevisionAction } from "@/app/writer/guides/actions";
import { EntityAutocomplete, type AutocompleteOption } from "@/components/guides/EntityAutocomplete";
import type { GuideEditorCatalogs } from "@/lib/guides/revision-types";
import type {
  EditableGuideData,
  EditableMainStats,
  EditableRankedItem,
  GuideRevisionStatus,
} from "@/lib/guides/revision-types";

type EditorTab = "kit" | "build" | "teams";

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "kit", label: "Kit" },
  { id: "build", label: "Build Guide" },
  { id: "teams", label: "Teams" },
];

export function GuideEditorForm({
  characterSlug,
  initialData,
  initialRevision,
  catalogs,
}: {
  characterSlug: string;
  initialData: EditableGuideData;
  catalogs: GuideEditorCatalogs;
  initialRevision?: {
    id: string;
    status: GuideRevisionStatus;
    reviewNote: string | null;
    sectionsChanged: string[];
  } | null;
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>("build");
  const [data, setData] = useState(initialData);
  const [revisionId, setRevisionId] = useState(initialRevision?.id ?? null);
  const [status, setStatus] = useState<GuideRevisionStatus | "unsaved">(initialRevision?.status ?? "unsaved");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weaponOptions = useMemo(
    () => catalogs.weapons.map((name) => ({ id: name, label: name })),
    [catalogs.weapons],
  );
  const artifactOptions = useMemo(
    () => catalogs.artifacts.map((name) => ({ id: name, label: name })),
    [catalogs.artifacts],
  );
  const characterOptions = useMemo(
    () =>
      catalogs.characters.map((character) => ({
        id: character.id,
        label: character.name,
        description: character.slug,
      })),
    [catalogs.characters],
  );

  const canSubmit = status !== "pending_review" && status !== "published";
  const changedLabel = useMemo(
    () => initialRevision?.sectionsChanged?.join(", ") || "Changes will appear after saving.",
    [initialRevision?.sectionsChanged],
  );

  function update(next: EditableGuideData) {
    setData(next);
    setStatus((current) => (current === "pending_review" || current === "published" ? current : "unsaved"));
  }

  function saveDraft() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveGuideDraftAction({ characterSlug, revisionId, payload: data });
        setRevisionId(result.id);
        setStatus(result.status);
        setMessage(`Draft saved. Sections changed: ${result.sectionsChanged.join(", ") || "none"}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save draft.");
      }
    });
  }

  function submitDraft() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await submitGuideRevisionAction({
          characterSlug,
          revisionId,
          payload: data,
        });
        setRevisionId(result.id);
        setStatus(result.status);
        setMessage("Submitted for admin review.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit draft.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Editing</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{data.character.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">Status: {status.replace("_", " ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={isPending || status === "pending_review" || status === "published"}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={submitDraft}
              disabled={isPending || !canSubmit}
              className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit for Review
            </button>
          </div>
        </div>
        {initialRevision?.reviewNote ? (
          <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
            Review note: {initialRevision.reviewNote}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-zinc-500">{changedLabel}</p>
      </section>

      {message ? <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p> : null}

      <div className="flex gap-2 overflow-x-auto border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? "border-indigo-300 text-white" : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "kit" ? <KitEditor data={data} update={update} /> : null}
      {activeTab === "build" ? (
        <BuildEditor
          data={data}
          update={update}
          weaponOptions={weaponOptions}
          artifactOptions={artifactOptions}
        />
      ) : null}
      {activeTab === "teams" ? (
        <TeamsEditor data={data} update={update} characterOptions={characterOptions} />
      ) : null}
    </div>
  );
}

function KitEditor({ data, update }: EditorProps) {
  const kit = data.kit;
  if (!kit) return <EmptyPanel label="No kit data exists for this character yet." />;
  const currentKit = kit;

  function setTalentDescription(key: "normalAttack" | "elementalSkill" | "elementalBurst", description: string) {
    const talent = currentKit[key];
    if (!talent) return;
    update({
      ...data,
      kit: { ...currentKit, [key]: { ...talent, description } },
    });
  }

  return (
    <Panel title="Kit">
      <Textarea label="Normal Attack" value={kit.normalAttack?.description ?? ""} onChange={(value) => setTalentDescription("normalAttack", value)} />
      <Textarea label="Elemental Skill" value={kit.elementalSkill?.description ?? ""} onChange={(value) => setTalentDescription("elementalSkill", value)} />
      <Textarea label="Elemental Burst" value={kit.elementalBurst?.description ?? ""} onChange={(value) => setTalentDescription("elementalBurst", value)} />
      <EntryListEditor
        label="Passive Talents"
        items={kit.passiveTalents}
        onChange={(passiveTalents) => update({ ...data, kit: { ...kit, passiveTalents } })}
      />
      <EntryListEditor
        label="Constellations"
        items={kit.constellations}
        onChange={(constellations) => update({ ...data, kit: { ...kit, constellations } })}
      />
    </Panel>
  );
}

function BuildEditor({
  data,
  update,
  weaponOptions,
  artifactOptions,
}: EditorProps & {
  weaponOptions: AutocompleteOption[];
  artifactOptions: AutocompleteOption[];
}) {
  const build = data.build;
  if (!build) return <EmptyPanel label="No build guide data exists for this character yet." />;
  const currentBuild = build;

  function setBuild(next: Partial<NonNullable<EditableGuideData["build"]>>) {
    update({ ...data, build: { ...currentBuild, ...next } });
  }

  function setMainStats(next: Partial<EditableMainStats>) {
    setBuild({ mainStats: { ...currentBuild.mainStats, ...next } });
  }

  return (
    <Panel title="Build Guide">
      <TextInput label="Role" value={build.role ?? ""} onChange={(role) => setBuild({ role })} />
      <RankedListEditor
        label="Best Weapons"
        items={build.bestWeapons}
        options={weaponOptions}
        placeholder="Search weapons..."
        onChange={(bestWeapons) => setBuild({ bestWeapons })}
      />
      <RankedListEditor
        label="Alternative Weapons"
        items={build.alternativeWeapons}
        options={weaponOptions}
        placeholder="Search weapons..."
        onChange={(alternativeWeapons) => setBuild({ alternativeWeapons })}
      />
      <RankedListEditor
        label="F2P Weapons"
        items={build.f2pWeapons}
        options={weaponOptions}
        placeholder="Search weapons..."
        onChange={(f2pWeapons) => setBuild({ f2pWeapons })}
      />
      <RankedListEditor
        label="Best Artifacts"
        items={build.bestArtifacts}
        options={artifactOptions}
        placeholder="Search artifacts..."
        onChange={(bestArtifacts) => setBuild({ bestArtifacts })}
        allowDescription
      />
      <RankedListEditor
        label="Alternative Artifacts"
        items={build.alternativeArtifacts}
        options={artifactOptions}
        placeholder="Search artifacts..."
        onChange={(alternativeArtifacts) => setBuild({ alternativeArtifacts })}
        allowDescription
      />

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <h3 className="text-sm font-semibold text-white">Artifact Stats</h3>
        <p className="text-xs text-zinc-500">
          Use `/` for multiple recommendations, e.g. ATK% / EM
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <TextInput
            label="Sands main stat"
            value={build.mainStats.sand ?? ""}
            onChange={(sand) => setMainStats({ sand })}
          />
          <TextInput
            label="Goblet main stat"
            value={build.mainStats.goblet ?? ""}
            onChange={(goblet) => setMainStats({ goblet })}
          />
          <TextInput
            label="Circlet main stat"
            value={build.mainStats.circlet ?? ""}
            onChange={(circlet) => setMainStats({ circlet })}
          />
        </div>
        <RankedListEditor
          label="Substat priority"
          items={build.substatPriority}
          onChange={(substatPriority) => setBuild({ substatPriority })}
          placeholder="e.g. CRIT Rate"
        />
      </div>

      <Textarea label="Recommended Stat Targets" value={build.energyRecharge ?? ""} onChange={(energyRecharge) => setBuild({ energyRecharge })} />
      <Textarea label="Rotation & Playstyle" value={build.rotationPlaystyle} onChange={(rotationPlaystyle) => setBuild({ rotationPlaystyle })} />
    </Panel>
  );
}

function TeamsEditor({
  data,
  update,
  characterOptions,
}: EditorProps & { characterOptions: AutocompleteOption[] }) {
  return (
    <Panel title="Teams">
      <div className="space-y-3">
        {data.teams.map((team, index) => (
          <div key={team.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Team Name"
                value={team.name}
                onChange={(name) => updateTeam(data, update, index, { ...team, name })}
              />
              <TextInput
                label="Team Type"
                value={team.type ?? ""}
                onChange={(type) => updateTeam(data, update, index, { ...team, type })}
              />
            </div>
            <Textarea
              label="Team Notes"
              value={team.description ?? ""}
              onChange={(description) => updateTeam(data, update, index, { ...team, description })}
            />
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {team.members.map((member, memberIndex) => (
                <div key={`${team.id}-${member.slotNumber}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                  <EntityAutocomplete
                    label={`Slot ${member.slotNumber}`}
                    value={member.characterName}
                    options={characterOptions}
                    placeholder="Search characters..."
                    onSelect={(option) => {
                      const members = [...team.members];
                      members[memberIndex] = {
                        ...member,
                        characterId: option.id,
                        characterName: option.label,
                      };
                      updateTeam(data, update, index, { ...team, members });
                    }}
                  />
                  <TextInput
                    label="Role"
                    value={member.role ?? ""}
                    onChange={(role) => {
                      const members = [...team.members];
                      members[memberIndex] = { ...member, role };
                      updateTeam(data, update, index, { ...team, members });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

type EditorProps = {
  data: EditableGuideData;
  update: (data: EditableGuideData) => void;
};

function EntryListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: NonNullable<EditableGuideData["kit"]>["passiveTalents"];
  onChange: (items: NonNullable<EditableGuideData["kit"]>["passiveTalents"]) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white">{label}</h3>
      {items.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
          <TextInput
            label="Name"
            value={item.name}
            onChange={(name) => {
              const next = [...items];
              next[index] = { ...item, name };
              onChange(next);
            }}
          />
          <Textarea
            label="Description"
            value={item.description}
            onChange={(description) => {
              const next = [...items];
              next[index] = { ...item, description };
              onChange(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function RankedListEditor({
  label,
  items,
  onChange,
  options,
  placeholder,
  allowDescription = false,
}: {
  label: string;
  items: EditableRankedItem[];
  onChange: (items: EditableRankedItem[]) => void;
  options?: AutocompleteOption[];
  placeholder?: string;
  allowDescription?: boolean;
}) {
  function updateItem(index: number, item: EditableRankedItem) {
    const next = [...items];
    next[index] = item;
    onChange(normalizeRanks(next));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(normalizeRanks(next));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <button
          type="button"
          onClick={() => onChange(normalizeRanks([...items, { rank: items.length + 1, name: "", description: "" }]))}
          className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/[0.05]"
        >
          Add
        </button>
      </div>
      {items.map((item, index) => (
        <div key={`${item.rank}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            {options ? (
              <EntityAutocomplete
                label={`#${item.rank}`}
                value={item.name}
                options={options}
                placeholder={placeholder}
                onSelect={(option) => updateItem(index, { ...item, name: option.label })}
              />
            ) : (
              <TextInput
                label={`#${item.rank}`}
                value={item.name}
                onChange={(name) => updateItem(index, { ...item, name })}
              />
            )}
            <div className="flex items-end gap-1">
              <button type="button" onClick={() => move(index, -1)} className="rounded-md border border-white/10 px-2 py-2 text-xs text-zinc-300">Up</button>
              <button type="button" onClick={() => move(index, 1)} className="rounded-md border border-white/10 px-2 py-2 text-xs text-zinc-300">Down</button>
              <button
                type="button"
                onClick={() => onChange(normalizeRanks(items.filter((_, itemIndex) => itemIndex !== index)))}
                className="rounded-md border border-rose-300/20 px-2 py-2 text-xs text-rose-100"
              >
                Remove
              </button>
            </div>
          </div>
          {allowDescription ? (
            <Textarea
              label="Artifact Description"
              value={item.description ?? ""}
              onChange={(description) => updateItem(index, { ...item, description })}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function normalizeRanks(items: EditableRankedItem[]) {
  return items.map((item, index) => ({ ...item, rank: index + 1 }));
}

function updateTeam(
  data: EditableGuideData,
  update: (data: EditableGuideData) => void,
  index: number,
  team: EditableGuideData["teams"][number],
) {
  const teams = [...data.teams];
  teams[index] = team;
  update({ ...data, teams });
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-400">{label}</p>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/40"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-cyan-300/40"
      />
    </label>
  );
}
