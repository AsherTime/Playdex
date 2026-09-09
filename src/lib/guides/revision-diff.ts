import type { EditableGuideData, EditableRankedItem, RevisionDiffLine } from "@/lib/guides/revision-types";

export function getChangedSections(base: EditableGuideData, draft: EditableGuideData): string[] {
  const sections = new Set<string>();
  for (const diff of getGuideRevisionDiff(base, draft)) {
    sections.add(diff.section);
  }
  return [...sections];
}

export function getGuideRevisionDiff(base: EditableGuideData, draft: EditableGuideData): RevisionDiffLine[] {
  const lines: RevisionDiffLine[] = [];

  compareText(lines, "Kit", "Normal Attack", base.kit?.normalAttack?.description, draft.kit?.normalAttack?.description);
  compareText(lines, "Kit", "Elemental Skill", base.kit?.elementalSkill?.description, draft.kit?.elementalSkill?.description);
  compareText(lines, "Kit", "Elemental Burst", base.kit?.elementalBurst?.description, draft.kit?.elementalBurst?.description);
  compareKitEntries(lines, "Passive Talent", base.kit?.passiveTalents ?? [], draft.kit?.passiveTalents ?? []);
  compareKitEntries(lines, "Constellation", base.kit?.constellations ?? [], draft.kit?.constellations ?? []);

  compareRankedItems(lines, "Weapons", "Best weapon", base.build?.bestWeapons ?? [], draft.build?.bestWeapons ?? []);
  compareRankedItems(lines, "Weapons", "Alternative weapon", base.build?.alternativeWeapons ?? [], draft.build?.alternativeWeapons ?? []);
  compareRankedItems(lines, "Weapons", "F2P weapon", base.build?.f2pWeapons ?? [], draft.build?.f2pWeapons ?? []);
  compareRankedItems(lines, "Artifacts", "Best artifact", base.build?.bestArtifacts ?? [], draft.build?.bestArtifacts ?? []);
  compareRankedItems(lines, "Artifacts", "Alternative artifact", base.build?.alternativeArtifacts ?? [], draft.build?.alternativeArtifacts ?? []);

  compareText(lines, "Build", "Role", base.build?.role, draft.build?.role);
  compareText(lines, "Build", "Energy recharge / stat targets", base.build?.energyRecharge, draft.build?.energyRecharge);
  compareText(lines, "Rotation & Playstyle", "Guide content", base.build?.rotationPlaystyle, draft.build?.rotationPlaystyle);

  compareTeams(lines, base, draft);

  return lines;
}

function compareKitEntries(
  lines: RevisionDiffLine[],
  label: string,
  baseItems: Array<{ name: string; description: string }>,
  draftItems: Array<{ name: string; description: string }>,
) {
  const names = new Set([...baseItems.map((item) => item.name), ...draftItems.map((item) => item.name)]);
  for (const name of names) {
    const baseItem = baseItems.find((item) => item.name === name);
    const draftItem = draftItems.find((item) => item.name === name);
    compareText(lines, "Kit", `${label}: ${name}`, baseItem?.description, draftItem?.description);
  }
}

function compareRankedItems(
  lines: RevisionDiffLine[],
  section: string,
  label: string,
  baseItems: EditableRankedItem[],
  draftItems: EditableRankedItem[],
) {
  const names = new Set([...baseItems.map((item) => item.name), ...draftItems.map((item) => item.name)]);
  for (const name of names) {
    const baseItem = baseItems.find((item) => item.name === name);
    const draftItem = draftItems.find((item) => item.name === name);
    if (!baseItem && draftItem) {
      lines.push({ section, label: `${label} added`, oldValue: null, newValue: formatRankedItem(draftItem) });
      continue;
    }
    if (baseItem && !draftItem) {
      lines.push({ section, label: `${label} removed`, oldValue: formatRankedItem(baseItem), newValue: null });
      continue;
    }
    if (!baseItem || !draftItem) continue;
    if (baseItem.rank !== draftItem.rank) {
      lines.push({
        section,
        label: `${name} ranking`,
        oldValue: `#${baseItem.rank}`,
        newValue: `#${draftItem.rank}`,
      });
    }
    compareText(lines, section, `${name} description`, baseItem.description, draftItem.description);
  }
}

function compareTeams(lines: RevisionDiffLine[], base: EditableGuideData, draft: EditableGuideData) {
  const max = Math.max(base.teams.length, draft.teams.length);
  for (let index = 0; index < max; index += 1) {
    const baseTeam = base.teams[index];
    const draftTeam = draft.teams[index];
    const label = draftTeam?.name ?? baseTeam?.name ?? `Team ${index + 1}`;

    if (!baseTeam && draftTeam) {
      lines.push({ section: "Teams", label: "Team added", oldValue: null, newValue: formatTeam(draftTeam) });
      continue;
    }
    if (baseTeam && !draftTeam) {
      lines.push({ section: "Teams", label: "Team removed", oldValue: formatTeam(baseTeam), newValue: null });
      continue;
    }
    if (!baseTeam || !draftTeam) continue;

    compareText(lines, "Teams", `${label} name`, baseTeam.name, draftTeam.name);
    compareText(lines, "Teams", `${label} type`, baseTeam.type, draftTeam.type);
    compareText(lines, "Teams", `${label} notes`, baseTeam.description, draftTeam.description);
    compareText(lines, "Teams", `${label} members`, formatTeamMembers(baseTeam), formatTeamMembers(draftTeam));
  }
}

function compareText(lines: RevisionDiffLine[], section: string, label: string, oldValue: unknown, newValue: unknown) {
  const oldText = normalizeDisplayValue(oldValue);
  const newText = normalizeDisplayValue(newValue);
  if (oldText === newText) return;
  lines.push({ section, label, oldValue: oldText || null, newValue: newText || null });
}

function normalizeDisplayValue(value: unknown) {
  return String(value ?? "").trim();
}

function formatRankedItem(item: EditableRankedItem) {
  return `#${item.rank} ${item.name}${item.description ? `\n${item.description}` : ""}`;
}

function formatTeam(team: EditableGuideData["teams"][number]) {
  return [team.name, team.type, team.description, formatTeamMembers(team)].filter(Boolean).join("\n");
}

function formatTeamMembers(team: EditableGuideData["teams"][number]) {
  return team.members
    .sort((a, b) => a.slotNumber - b.slotNumber)
    .map((member) => `${member.slotNumber}. ${member.characterName}${member.role ? ` (${member.role})` : ""}`)
    .join("\n");
}
