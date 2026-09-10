"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter,
  pointerWithin, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveTierList } from "@/app/admin/tier-lists/[gameId]/actions";
import type { TierCharacter, TierEntryInput, TierListData } from "@/lib/tier-lists/types";

const UNRANKED = "__unranked";
const tierColors = ["bg-rose-400/20 text-rose-200", "bg-amber-400/20 text-amber-200",
  "bg-yellow-400/20 text-yellow-200", "bg-lime-400/20 text-lime-200",
  "bg-emerald-400/20 text-emerald-200", "bg-cyan-400/20 text-cyan-200",
  "bg-sky-400/20 text-sky-200", "bg-zinc-400/20 text-zinc-200"];

// Prefer a portrait over its containing row. Outside the board cancels a pointer drop.
const collisions: CollisionDetection = args => {
  const hits = args.pointerCoordinates ? pointerWithin(args) : closestCenter(args);
  const portraits = hits.filter(hit => !String(hit.id).startsWith("row:"));
  return portraits.length ? portraits : hits;
};

export function TierListEditor({ data }: { data: TierListData }) {
  const [entries, setEntries] = useState(data.entries);
  const [revision, setRevision] = useState(data.list.revision);
  const [role, setRole] = useState(data.list.roles[0]);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const characters = new Map(data.characters.map(character => [character.id, character]));
  const ranked = entries.filter(entry => entry.role === role);
  const rankedIds = new Set(ranked.map(entry => entry.character_id));
  const unranked = data.characters.filter(character => !rankedIds.has(character.id));
  const activeCharacter = activeId ? characters.get(activeId) : null;

  function drop({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (pending || !over || active.id === over.id) return;
    const characterId = String(active.id);
    const tier = over.data.current?.tier as string | undefined;
    if (!tier || (tier !== UNRANKED && !data.list.tiers.includes(tier))) return;
    const previous = entries.find(entry => entry.role === role && entry.character_id === characterId);
    if (!previous && tier === UNRANKED) return;
    const next = entries.filter(entry => !(entry.role === role && entry.character_id === characterId));
    if (tier !== UNRANKED) {
      const group = ranked.filter(entry => entry.tier === tier).sort((a,b) => a.sort_order-b.sort_order);
      const overIndex = group.findIndex(entry => entry.character_id === over.id);
      const targetIndex = overIndex < 0 ? group.length : overIndex;
      const reordered = group.filter(entry => entry.character_id !== characterId);
      reordered.splice(Math.min(targetIndex, reordered.length), 0, {
        character_id: characterId, role, tier, sort_order: 0,
        notes: previous?.notes ?? data.entries.find(entry => entry.character_id === characterId && entry.role === role)?.notes ?? null,
      });
      next.splice(0, next.length, ...next.filter(entry => entry.role !== role || entry.tier !== tier),
        ...reordered.map((entry, index) => ({ ...entry, sort_order: index })));
    }
    for (const sourceTier of data.list.tiers) {
      next.filter(entry => entry.role === role && entry.tier === sourceTier)
        .sort((a,b) => a.sort_order-b.sort_order)
        .forEach((entry, index) => { next[next.indexOf(entry)] = { ...entry, sort_order: index }; });
    }
    setEntries(next);
    setDirty(true);
    setMessage("");
  }

  const save = () => startTransition(async () => {
    setMessage("");
    const payload: TierEntryInput[] = data.list.roles.flatMap(selectedRole =>
      data.list.tiers.flatMap(tier => entries.filter(entry => entry.role === selectedRole && entry.tier === tier)
        .sort((a,b) => a.sort_order-b.sort_order).map((entry, index) => ({ ...entry, sort_order: index }))));
    try {
      const result = await saveTierList(data.list.id, revision, payload);
      if (result.error) { setMessage(result.error); return; }
      setRevision(result.revision!);
      setEntries(payload);
      setDirty(false);
      setMessage("Tier list saved.");
    } catch { setMessage("Could not save. Check your admin session and try again."); }
  });

  return <div className="min-w-0 space-y-4">
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/95 py-3 backdrop-blur">
      <div role="tablist" aria-label="Tier list roles" className="flex flex-wrap gap-1">
        {data.list.roles.map(value => <button key={value} type="button" role="tab" id={`role-${value.replace(/\W/g, "")}`}
          aria-selected={role === value} aria-controls="tier-board" disabled={pending || !!activeId}
          onClick={() => { setRole(value); setSearch(""); }}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${role === value ? "border-cyan-300 text-cyan-100" : "border-transparent text-zinc-400 hover:text-white"}`}>
          {value}
        </button>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span role="status" className={`text-xs ${dirty ? "text-amber-200" : "text-zinc-400"}`}>{message || (dirty ? "Unsaved changes" : "")}</span>
        <button type="button" onClick={save} disabled={pending || !dirty || !!activeId}
          className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40">
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
    <DndContext id="tier-list-editor" sensors={sensors} collisionDetection={collisions}
      onDragStart={event => setActiveId(String(event.active.id))} onDragEnd={drop} onDragCancel={() => setActiveId(null)}>
      <div id="tier-board" role="tabpanel" aria-labelledby={`role-${role.replace(/\W/g, "")}`} className="min-w-0 divide-y divide-white/10 border-y border-white/10">
        {data.list.tiers.map((tier, index) => <TierRow key={`${role}:${tier}`} tier={tier} color={tierColors[index % tierColors.length]}
          dragging={!!activeId} disabled={pending}
          characters={ranked.filter(entry => entry.tier === tier).sort((a,b) => a.sort_order-b.sort_order)
            .map(entry => characters.get(entry.character_id)!).filter(Boolean)} />)}
      </div>
      <section className="min-w-0 space-y-3 pt-5" aria-label="Unranked Characters">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Unranked Characters <span className="ml-1 text-xs font-normal text-zinc-500">{unranked.length}</span></h2>
          <input type="search" aria-label="Search unranked characters" placeholder="Search characters" value={search}
            disabled={pending || !!activeId} onChange={event => setSearch(event.target.value)}
            className="w-full min-w-0 rounded-md border border-white/15 bg-zinc-950 px-3 py-2 text-sm sm:w-64" />
        </div>
        <TierRow tier={UNRANKED} dragging={!!activeId} disabled={pending}
          characters={unranked.filter(character => character.name.toLowerCase().includes(search.trim().toLowerCase()))} />
      </section>
      <DragOverlay>{activeCharacter ? <div className="w-20 rotate-2 rounded-md bg-zinc-900 shadow-xl ring-2 ring-cyan-300"><Portrait character={activeCharacter} /></div> : null}</DragOverlay>
    </DndContext>
  </div>;
}

function TierRow({ tier, characters, color = "", dragging, disabled }: {
  tier: string; characters: TierCharacter[]; color?: string; dragging: boolean; disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `row:${tier}`, data: { tier }, disabled });
  const pool = tier === UNRANKED;
  return <div ref={setNodeRef} data-tier-row={tier} aria-label={pool ? "Unranked drop zone" : `${tier} drop zone`}
    className={`grid min-w-0 transition-colors ${pool ? "grid-cols-1 rounded-md border border-dashed border-white/20" : "grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[68px_minmax(0,1fr)]"} ${isOver ? "bg-cyan-300/10 ring-2 ring-inset ring-cyan-300" : dragging ? "bg-white/[0.035] ring-1 ring-inset ring-cyan-300/20" : "bg-white/[0.015]"}`}>
    {!pool ? <h2 className={`flex items-center justify-center text-lg font-bold ${color}`}>{tier}</h2> : null}
    <SortableContext items={characters.map(character => character.id)} strategy={rectSortingStrategy}>
      <div className="flex min-h-[116px] min-w-0 flex-wrap content-start items-start gap-2 p-2 sm:p-3">
        {characters.map(character => <SortablePortrait key={character.id} character={character} tier={tier} disabled={disabled} />)}
        {!characters.length ? <span className="self-center px-3 py-7 text-xs text-zinc-500">{pool ? "No characters" : "Empty"}</span> : null}
      </div>
    </SortableContext>
  </div>;
}

function SortablePortrait({ character, tier, disabled }: { character: TierCharacter; tier: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: character.id, data: { tier }, disabled,
  });
  return <button ref={setNodeRef} type="button" {...attributes} {...listeners}
    aria-label={`Drag ${character.name}`} title={character.name} data-character-id={character.id}
    style={{ transform: CSS.Transform.toString(transform), transition }}
    className={`w-20 shrink-0 touch-none select-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isDragging ? "opacity-25" : "cursor-grab active:cursor-grabbing"} ${isOver ? "bg-cyan-300/15 ring-2 ring-cyan-300" : "hover:bg-white/5"}`}>
    <Portrait character={character} />
  </button>;
}

function Portrait({ character }: { character: TierCharacter }) {
  return <>
    <div className="relative mx-auto h-[72px] w-[72px] overflow-hidden rounded-md bg-white/5">
      {character.icon ? <Image src={character.icon} alt="" fill sizes="72px" draggable={false} className="pointer-events-none object-contain" /> : null}
    </div>
    <span className="mt-1 block h-8 overflow-hidden px-0.5 text-center text-[11px] leading-4 text-zinc-200 [overflow-wrap:anywhere]">{character.name}</span>
  </>;
}
