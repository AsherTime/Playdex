"use client";

import { useState, useTransition } from "react";
import { saveTierList } from "@/app/admin/tier-lists/[gameId]/actions";
import type { TierEntryInput, TierListData } from "@/lib/tier-lists/types";

const field = "min-w-0 rounded-md border border-white/15 bg-zinc-950 px-2 py-2 text-sm text-zinc-200";

export function TierListEditor({ data }: { data: TierListData }) {
  const [entries, setEntries] = useState(data.entries.map((e, i) => ({ ...e, key: String(i) })));
  const [revision, setRevision] = useState(data.list.revision);
  const [search, setSearch] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(data.characters[0]?.id ?? "");
  const [selectedRole, setSelectedRole] = useState(data.list.roles[0]);
  const [selectedTier, setSelectedTier] = useState(data.list.tiers[0]);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const characters = new Map(data.characters.map(c => [c.id, c]));
  const ordered = [...entries].sort((a, b) => data.list.tiers.indexOf(a.tier)-data.list.tiers.indexOf(b.tier) ||
    data.list.roles.indexOf(a.role)-data.list.roles.indexOf(b.role) || a.sort_order-b.sort_order);
  const update = (key: string, patch: Partial<TierEntryInput>) => {
    const current = entries.find(e => e.key === key)!;
    if (patch.role && entries.some(e => e.key !== key && e.character_id === current.character_id && e.role === patch.role)) {
      setMessage("This character already has a placement in that role."); return;
    }
    setEntries(previous => {
      const changed = { ...current, ...patch };
      const group = previous.filter(e => e.key !== key && e.tier === changed.tier && e.role === changed.role)
        .sort((a,b) => a.sort_order-b.sort_order);
      const target = patch.sort_order !== undefined ? patch.sort_order :
        (patch.tier || patch.role ? group.length : current.sort_order);
      group.splice(Math.min(target, group.length), 0, changed);
      const positions = new Map(group.map((e, index) => [e.key, { ...e, sort_order: index }]));
      return previous.map(e => positions.get(e.key) ?? e);
    });
    setDirty(true); setMessage("");
  };
  const add = () => {
    if (entries.some(e => e.character_id === selectedCharacter && e.role === selectedRole)) {
      setMessage("This character already has a placement in that role."); return;
    }
    setEntries(previous => [...previous, { key: crypto.randomUUID(), character_id: selectedCharacter,
      role: selectedRole, tier: selectedTier, notes: null,
      sort_order: Math.max(-1, ...previous.filter(e => e.role === selectedRole && e.tier === selectedTier).map(e => e.sort_order)) + 1 }]);
    setDirty(true); setMessage("");
  };
  const save = () => startTransition(async () => {
    setMessage("");
    const counters = new Map<string, number>();
    const payload = ordered.map(({ key: _key, ...entry }) => {
      const group = `${entry.tier}|${entry.role}`;
      const position = counters.get(group) ?? 0;
      counters.set(group, position + 1);
      return { ...entry, sort_order: position };
    });
    try {
      const result = await saveTierList(data.list.id, revision, payload);
      if (result.error) { setMessage(result.error); return; }
      setRevision(result.revision!);
      setEntries(previous => previous.map(entry => ({ ...entry,
        sort_order: payload.find(e => e.character_id === entry.character_id && e.role === entry.role)!.sort_order,
      })));
      setDirty(false); setMessage("Tier list saved.");
    } catch { setMessage("Could not save. Check your admin session and try again."); }
  });

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={save} disabled={pending || !dirty}
        className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40">
        {pending ? "Saving..." : "Save changes"}
      </button>
      <span role="status" className="text-sm text-zinc-300">{message || (dirty ? "Unsaved changes" : "")}</span>
    </div>
    <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-60">
      <div className="flex flex-wrap items-end gap-3 border-y border-white/10 py-4">
        <label className="flex min-w-0 max-w-full flex-col gap-1 text-xs text-zinc-400">Character
          <select aria-label="Add character" className={field} value={selectedCharacter} onChange={e => setSelectedCharacter(e.target.value)}>
            {data.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">Role
          <select aria-label="Add role" className={field} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
            {data.list.roles.map(role => <option key={role}>{role}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">Tier
          <select aria-label="Add tier" className={field} value={selectedTier} onChange={e => setSelectedTier(e.target.value)}>
            {data.list.tiers.map(tier => <option key={tier}>{tier}</option>)}
          </select>
        </label>
        <button type="button" onClick={add} className="rounded-md border border-white/20 px-3 py-2 text-sm">Add placement</button>
      </div>
      <input type="search" aria-label="Filter characters" placeholder="Search characters" value={search}
        onChange={e => setSearch(e.target.value)} className={`${field} w-full sm:max-w-xs`} />
      <div className="divide-y divide-white/10">
        {ordered.filter(e => characters.get(e.character_id)?.name.toLowerCase().includes(search.toLowerCase())).map(entry => {
          const name = characters.get(entry.character_id)?.name ?? entry.character_id;
          return <div key={entry.key} data-editor-character={entry.character_id} className="flex min-w-0 flex-wrap items-center gap-3 py-3">
            <span className="w-full min-w-0 break-words text-sm font-medium sm:w-44">{name}</span>
            <select aria-label={`Tier for ${name} ${entry.role}`} className={field} value={entry.tier} onChange={e => update(entry.key, { tier: e.target.value })}>
              {data.list.tiers.map(tier => <option key={tier}>{tier}</option>)}
            </select>
            <select aria-label={`Role for ${name} ${entry.role}`} className={field} value={entry.role} onChange={e => update(entry.key, { role: e.target.value })}>
              {data.list.roles.map(role => <option key={role}>{role}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs text-zinc-400">Position
              <input type="number" min={1} aria-label={`Position for ${name} ${entry.role}`} className={`${field} w-16`}
                value={entry.sort_order + 1} onChange={e => update(entry.key, { sort_order: Math.max(0, Number(e.target.value)-1) })} />
            </label>
            <button type="button" aria-label={`Remove ${name} ${entry.role}`} className="px-2 py-2 text-xs text-rose-300"
              onClick={() => { setEntries(previous => previous.filter(e => e.key !== entry.key)); setDirty(true); setMessage(""); }}>Remove</button>
          </div>;
        })}
      </div>
    </fieldset>
  </div>;
}
