import "server-only";

import { getChangedSections } from "@/lib/guides/revision-diff";
import type {
  EditableGuideData,
  EditableKitEntry,
  EditableRankedItem,
  GuideRevisionDetail,
  GuideRevisionSummary,
} from "@/lib/guides/revision-types";
import { requireAdmin, requireGuideWriter, type AuthzUser } from "@/lib/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/service-client";
import type { Database, Json } from "@/types/database";

const GAME_ID = "genshin-impact";

type RevisionRow = Database["public"]["Tables"]["guide_revisions"]["Row"];
type CharacterRow = Database["public"]["Tables"]["game_characters"]["Row"];
type BuildRow = Database["public"]["Tables"]["character_builds"]["Row"];
type KitRow = Database["public"]["Tables"]["character_kits"]["Row"];
type TeamRow = Database["public"]["Tables"]["character_team_comps"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["character_team_members"]["Row"];

export async function getEditableGuideForCharacter(characterSlug: string, revisionId?: string) {
  const user = await requireGuideWriter();
  const published = await getPublishedEditableGuide(characterSlug);
  if (!published) return null;

  const draft = revisionId
    ? await getRevisionForUser(revisionId, user)
    : await getLatestEditableRevisionForCharacter(published.character.id, user.id);

  return {
    user,
    published,
    revision: draft,
    initialData: draft?.draft ?? published,
  };
}

export async function listWriterGuideRevisions(): Promise<GuideRevisionSummary[]> {
  const user = await requireGuideWriter();
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("guide_revisions")
    .select("*")
    .eq("author_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return hydrateRevisionSummaries(data ?? []);
}

export async function listEditableGuideCharacters() {
  await requireGuideWriter();
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("game_characters")
    .select("id, slug, display_name, element")
    .eq("game_id", GAME_ID)
    .order("display_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((character) => ({
    id: character.id,
    slug: character.slug,
    name: character.display_name,
    element: character.element,
  }));
}

export async function listPendingGuideReviews(): Promise<GuideRevisionSummary[]> {
  await requireAdmin();
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("guide_revisions")
    .select("*")
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) throw error;
  return hydrateRevisionSummaries(data ?? []);
}

export async function countPendingGuideReviews(): Promise<number> {
  await requireAdmin();
  const supabase = createServiceSupabaseClient();
  const { count, error } = await supabase
    .from("guide_revisions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) throw error;
  return count ?? 0;
}

export async function getAdminGuideReview(revisionId: string): Promise<GuideRevisionDetail | null> {
  await requireAdmin();
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("guide_revisions")
    .select("*")
    .eq("id", revisionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return hydrateRevisionDetail(data);
}

export async function saveGuideDraft(characterSlug: string, payload: EditableGuideData, revisionId?: string) {
  const user = await requireGuideWriter();
  const published = await getPublishedEditableGuide(characterSlug);
  if (!published || published.character.id !== payload.character.id) {
    throw new Error("Guide character not found.");
  }

  const sectionsChanged = getChangedSections(published, payload);
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const title = `${published.character.name} guide update`;

  if (revisionId) {
    const existing = await getRevisionForUser(revisionId, user);
    if (!existing || !["draft", "rejected"].includes(existing.status)) {
      throw new Error("This revision can no longer be edited.");
    }

    const { data, error } = await supabase
      .from("guide_revisions")
      .update({
        status: "draft",
        title,
        sections_changed: sectionsChanged,
        base_kit: published.kit as Json,
        draft_kit: payload.kit as Json,
        base_build: published.build as Json,
        draft_build: payload.build as Json,
        base_teams: published.teams as Json,
        draft_teams: payload.teams as Json,
        base_version: buildBaseVersion(published) as Json,
        submitted_at: null,
        reviewed_at: null,
        reviewed_by: null,
        review_note: null,
      })
      .eq("id", revisionId)
      .select("*")
      .single();

    if (error) throw error;
    return hydrateRevisionDetail(data);
  }

  const { data, error } = await supabase
    .from("guide_revisions")
    .insert({
      game_id: GAME_ID,
      character_id: published.character.id,
      author_user_id: user.id,
      status: "draft",
      title,
      sections_changed: sectionsChanged,
      base_kit: published.kit as Json,
      draft_kit: payload.kit as Json,
      base_build: published.build as Json,
      draft_build: payload.build as Json,
      base_teams: published.teams as Json,
      draft_teams: payload.teams as Json,
      base_version: { ...buildBaseVersion(published), createdAt: now } as Json,
    })
    .select("*")
    .single();

  if (error) throw error;
  return hydrateRevisionDetail(data);
}

export async function submitGuideRevision(input: {
  characterSlug: string;
  payload: EditableGuideData;
  revisionId?: string | null;
}) {
  const user = await requireGuideWriter();
  const published = await getPublishedEditableGuide(input.characterSlug);
  if (!published || published.character.id !== input.payload.character.id) {
    throw new Error("Guide character not found.");
  }

  const sectionsChanged = getChangedSections(published, input.payload);
  if (!sectionsChanged.length) {
    throw new Error("No changes to submit.");
  }

  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const title = `${published.character.name} guide update`;
  const revisionFields = {
    status: "pending_review" as const,
    title,
    sections_changed: sectionsChanged,
    base_kit: published.kit as Json,
    draft_kit: input.payload.kit as Json,
    base_build: published.build as Json,
    draft_build: input.payload.build as Json,
    base_teams: published.teams as Json,
    draft_teams: input.payload.teams as Json,
    base_version: buildBaseVersion(published) as Json,
    submitted_at: now,
    reviewed_at: null,
    reviewed_by: null,
    review_note: null,
  };

  if (input.revisionId) {
    const existing = await getRevisionForUser(input.revisionId, user);
    if (!existing || !["draft", "rejected"].includes(existing.status)) {
      throw new Error("Only your draft or rejected revisions can be submitted.");
    }

    const { data, error } = await supabase
      .from("guide_revisions")
      .update(revisionFields)
      .eq("id", input.revisionId)
      .eq("author_user_id", user.id)
      .in("status", ["draft", "rejected"])
      .select("*");

    if (error) throw error;
    if (!data?.length) {
      throw new Error("Could not submit revision for review.");
    }
    if (data[0].status !== "pending_review" || !data[0].submitted_at) {
      throw new Error("Submit did not reach pending review.");
    }
    return hydrateRevisionDetail(data[0]);
  }

  const { data, error } = await supabase
    .from("guide_revisions")
    .insert({
      game_id: GAME_ID,
      character_id: published.character.id,
      author_user_id: user.id,
      ...revisionFields,
      base_version: { ...buildBaseVersion(published), createdAt: now } as Json,
    })
    .select("*")
    .single();

  if (error) throw error;
  if (data.status !== "pending_review" || !data.submitted_at) {
    throw new Error("Submit did not reach pending review.");
  }
  return hydrateRevisionDetail(data);
}

export async function approveAndPublishGuideRevision(revisionId: string) {
  const admin = await requireAdmin();
  const detail = await getAdminGuideReview(revisionId);
  if (!detail || detail.status !== "pending_review") {
    throw new Error("Only pending revisions can be approved.");
  }

  await publishGuideData(detail);

  const supabase = createServiceSupabaseClient();
  await supabase
    .from("guide_revisions")
    .update({ status: "approved" })
    .eq("character_id", detail.characterId)
    .eq("status", "published")
    .neq("id", revisionId);

  const { data, error } = await supabase
    .from("guide_revisions")
    .update({
      status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      published_at: new Date().toISOString(),
      review_note: null,
    })
    .eq("id", revisionId)
    .select("*")
    .single();

  if (error) throw error;
  return hydrateRevisionDetail(data);
}

export async function rejectGuideRevision(revisionId: string, reviewNote: string) {
  const admin = await requireAdmin();
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("guide_revisions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      review_note: reviewNote.trim() || "Rejected.",
    })
    .eq("id", revisionId)
    .eq("status", "pending_review")
    .select("*")
    .single();

  if (error) throw error;
  return hydrateRevisionDetail(data);
}

async function getPublishedEditableGuide(characterSlug: string): Promise<EditableGuideData | null> {
  const supabase = createServiceSupabaseClient();
  const { data: character, error: characterError } = await supabase
    .from("game_characters")
    .select("*")
    .eq("game_id", GAME_ID)
    .eq("slug", characterSlug)
    .maybeSingle();

  if (characterError) throw characterError;
  if (!character) return null;

  const [kitResult, buildsResult, teamsResult] = await Promise.all([
    supabase.from("character_kits").select("*").eq("character_id", character.id).maybeSingle(),
    supabase.from("character_builds").select("*").eq("character_id", character.id),
    supabase
      .from("character_team_comps")
      .select("*")
      .eq("character_id", character.id)
      .order("rank_order", { ascending: true }),
  ]);

  if (kitResult.error) throw kitResult.error;
  if (buildsResult.error) throw buildsResult.error;
  if (teamsResult.error) throw teamsResult.error;

  const teamRows = selectPublishedTeams(teamsResult.data ?? []);
  const teamIds = teamRows.map((team) => team.id);
  const { data: members, error: membersError } = teamIds.length
    ? await supabase
        .from("character_team_members")
        .select("*")
        .in("team_id", teamIds)
        .order("slot_number", { ascending: true })
    : { data: [], error: null };

  if (membersError) throw membersError;
  return toEditableGuideData(character, kitResult.data, selectPublishedBuild(buildsResult.data ?? []), teamRows, members ?? []);
}

async function getLatestEditableRevisionForCharacter(characterId: string, userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("guide_revisions")
    .select("*")
    .eq("character_id", characterId)
    .eq("author_user_id", userId)
    .in("status", ["draft", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? hydrateRevisionDetail(data) : null;
}

async function getRevisionForUser(revisionId: string, user: AuthzUser) {
  const supabase = createServiceSupabaseClient();
  let query = supabase.from("guide_revisions").select("*").eq("id", revisionId);
  if (user.role !== "admin") query = query.eq("author_user_id", user.id);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? hydrateRevisionDetail(data) : null;
}

async function hydrateRevisionSummaries(rows: RevisionRow[]): Promise<GuideRevisionSummary[]> {
  if (!rows.length) return [];
  const supabase = createServiceSupabaseClient();
  const characterIds = [...new Set(rows.map((row) => row.character_id))];
  const authorIds = [...new Set(rows.map((row) => row.author_user_id))];

  const [charactersResult, profilesResult] = await Promise.all([
    supabase.from("game_characters").select("id, slug, display_name").in("id", characterIds),
    supabase.from("profiles").select("id, name, email").in("id", authorIds),
  ]);

  if (charactersResult.error) throw charactersResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const characters = new Map((charactersResult.data ?? []).map((character) => [character.id, character]));
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  return rows.map((row) => toRevisionSummary(row, characters.get(row.character_id), profiles.get(row.author_user_id)));
}

async function hydrateRevisionDetail(row: RevisionRow): Promise<GuideRevisionDetail> {
  const [summary] = await hydrateRevisionSummaries([row]);
  const character = {
    id: summary.characterId,
    slug: summary.characterSlug,
    name: summary.characterName,
    gameId: summary.gameId,
  };
  return {
    ...summary,
    base: { ...revisionDataFromRow(row, "base"), character },
    draft: { ...revisionDataFromRow(row, "draft"), character },
  };
}

function toRevisionSummary(
  row: RevisionRow,
  character?: Pick<CharacterRow, "id" | "slug" | "display_name">,
  profile?: { id: string; name: string | null; email: string },
): GuideRevisionSummary {
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    gameId: row.game_id,
    characterId: row.character_id,
    characterName: character?.display_name ?? row.character_id,
    characterSlug: character?.slug ?? row.character_id,
    authorUserId: row.author_user_id,
    authorName: profile?.name || profile?.email || "Unknown writer",
    authorEmail: profile?.email ?? "",
    sectionsChanged: row.sections_changed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
  };
}

function revisionDataFromRow(row: RevisionRow, prefix: "base" | "draft"): EditableGuideData {
  return {
    character: {
      id: row.character_id,
      slug: row.character_id.replace(`${GAME_ID}-`, ""),
      name: row.character_id,
      gameId: row.game_id,
    },
    kit: (prefix === "base" ? row.base_kit : row.draft_kit) as EditableGuideData["kit"],
    build: (prefix === "base" ? row.base_build : row.draft_build) as EditableGuideData["build"],
    teams: ((prefix === "base" ? row.base_teams : row.draft_teams) as EditableGuideData["teams"]) ?? [],
  };
}

function toEditableGuideData(
  character: CharacterRow,
  kit: KitRow | null,
  build: BuildRow | null,
  teams: TeamRow[],
  members: TeamMemberRow[],
): EditableGuideData {
  const membersByTeam = new Map<string, TeamMemberRow[]>();
  for (const member of members) {
    membersByTeam.set(member.team_id, [...(membersByTeam.get(member.team_id) ?? []), member]);
  }

  return {
    character: {
      id: character.id,
      slug: character.slug,
      name: character.display_name,
      gameId: character.game_id,
    },
    kit: kit
      ? {
          sourceUrl: kit.source_url,
          normalAttack: asKitEntry(kit.normal_attack),
          elementalSkill: asKitEntry(kit.elemental_skill),
          elementalBurst: asKitEntry(kit.elemental_burst),
          passiveTalents: asKitEntries(kit.passive_talents),
          constellations: asKitEntries(kit.constellations),
          ruleTerms: asRuleTerms(kit.rule_terms),
        }
      : null,
    build: build
      ? {
          sourceUrl: build.source_url,
          buildName: build.build_name,
          role: build.role,
          bestWeapons: asRankedItems(build.best_weapons),
          alternativeWeapons: asRankedItems(build.alternative_weapons),
          f2pWeapons: asRankedItems(build.f2p_weapons),
          bestArtifacts: asRankedItems(build.best_artifacts),
          alternativeArtifacts: asRankedItems(build.alternative_artifacts),
          mainStats: build.main_stats,
          substatPriority: asRankedItems(build.substat_priority),
          talentPriority: asRankedItems(build.talent_priority),
          energyRecharge: build.energy_recharge,
          rotation: asRotation(build.rotation),
          rotationPlaystyle: build.rotation_playstyle ?? asRotation(build.rotation).map((step) => step.text).join("\n"),
          structuredSections: build.structured_sections,
        }
      : null,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.team_name ?? `Team ${team.rank_order}`,
      type: team.team_type,
      description: team.description,
      rankOrder: team.rank_order,
      members: (membersByTeam.get(team.id) ?? []).map((member) => ({
        slotNumber: member.slot_number,
        characterId: member.character_id,
        characterName: member.character_name,
        role: member.role,
        isFlex: member.is_flex,
        alternatives: member.alternatives,
      })),
    })),
  };
}

async function publishGuideData(revision: GuideRevisionDetail) {
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();

  if (revision.draft.kit) {
    await checked(
      supabase.from("character_kits").upsert(
        {
          id: `${revision.characterId}-kit`,
          character_id: revision.characterId,
          guide_source_record_id: null,
          source_site: "manual",
          source_url: `/admin/reviews/${revision.id}`,
          source_version: "manual",
          normal_attack: revision.draft.kit.normalAttack as Json,
          elemental_skill: revision.draft.kit.elementalSkill as Json,
          elemental_burst: revision.draft.kit.elementalBurst as Json,
          passive_talents: revision.draft.kit.passiveTalents as Json,
          constellations: revision.draft.kit.constellations as Json,
          rule_terms: revision.draft.kit.ruleTerms as Json,
          imported_at: now,
          last_checked_at: now,
        },
        { onConflict: "id" },
      ),
      "publish kit",
    );
  }

  if (revision.draft.build) {
    await checked(
      supabase.from("character_builds").upsert(
        {
          id: `${revision.characterId}-manual-build`,
          character_id: revision.characterId,
          guide_source_record_id: null,
          source_site: "manual",
          source_url: `/admin/reviews/${revision.id}`,
          build_name: revision.draft.build.buildName || "Default",
          role: revision.draft.build.role,
          patch: null,
          best_weapons: revision.draft.build.bestWeapons as Json,
          alternative_weapons: revision.draft.build.alternativeWeapons as Json,
          f2p_weapons: revision.draft.build.f2pWeapons as Json,
          best_artifacts: revision.draft.build.bestArtifacts as Json,
          alternative_artifacts: revision.draft.build.alternativeArtifacts as Json,
          main_stats: revision.draft.build.mainStats,
          substat_priority: revision.draft.build.substatPriority as Json,
          talent_priority: revision.draft.build.talentPriority as Json,
          energy_recharge: revision.draft.build.energyRecharge,
          rotation: textToRotation(revision.draft.build.rotationPlaystyle) as Json,
          rotation_playstyle: revision.draft.build.rotationPlaystyle,
          structured_sections: revision.draft.build.structuredSections,
          imported_at: now,
          last_checked_at: now,
        },
        { onConflict: "id" },
      ),
      "publish build",
    );
  }

  await checked(
    supabase
      .from("character_team_comps")
      .delete()
      .eq("character_id", revision.characterId)
      .eq("source_site", "manual"),
    "clear manual teams",
  );

  if (revision.draft.teams.length) {
    const teamRows = revision.draft.teams.map((team, index) => ({
      id: `${revision.characterId}-manual-team-${index + 1}`,
      character_id: revision.characterId,
      guide_source_record_id: null,
      source_site: "manual",
      source_url: `/admin/reviews/${revision.id}`,
      team_name: team.name,
      team_type: team.type,
      rank_order: index + 1,
      description: team.description,
      metadata: { revisionId: revision.id },
      imported_at: now,
      last_checked_at: now,
    }));

    await checked(supabase.from("character_team_comps").insert(teamRows), "publish teams");

    const memberRows = revision.draft.teams.flatMap((team, index) =>
      team.members.map((member) => ({
        team_id: `${revision.characterId}-manual-team-${index + 1}`,
        slot_number: member.slotNumber,
        character_id: member.characterId,
        character_name: member.characterName,
        role: member.role,
        is_flex: member.isFlex,
        alternatives: member.alternatives,
        metadata: { revisionId: revision.id },
      })),
    );

    if (memberRows.length) {
      await checked(supabase.from("character_team_members").insert(memberRows), "publish team members");
    }
  }
}

function selectPublishedBuild(builds: BuildRow[]) {
  return builds.find((build) => build.source_site === "manual") ?? builds[0] ?? null;
}

function selectPublishedTeams(teams: TeamRow[]) {
  const manual = teams.filter((team) => team.source_site === "manual");
  return manual.length ? manual : teams.filter((team) => team.source_site !== "manual");
}

function buildBaseVersion(guide: EditableGuideData) {
  return {
    characterId: guide.character.id,
    capturedAt: new Date().toISOString(),
    kitSourceUrl: guide.kit?.sourceUrl ?? null,
    buildSourceUrl: guide.build?.sourceUrl ?? null,
    teamCount: guide.teams.length,
  };
}

function asRankedItems(value: Json): EditableRankedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.name !== "string") return [];
    return [
      {
        rank: typeof item.rank === "number" ? item.rank : index + 1,
        name: item.name,
        sourceRef: typeof item.sourceRef === "string" ? item.sourceRef : null,
        assetPath: typeof item.assetPath === "string" ? item.assetPath : null,
        description: typeof item.description === "string" ? item.description : null,
      },
    ];
  });
}

function asKitEntry(value: Json): EditableKitEntry | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.description !== "string") return null;
  return {
    id: String(value.id ?? value.name),
    type: typeof value.type === "string" ? value.type : "talent",
    rank: typeof value.rank === "number" ? value.rank : 1,
    name: value.name,
    description: value.description,
  };
}

function asKitEntries(value: Json): EditableKitEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map(asKitEntry).filter((entry): entry is EditableKitEntry => Boolean(entry));
}

function asRuleTerms(value: Json) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) && typeof item.term === "string" ? { term: item.term } : null))
    .filter((item): item is { term: string } => Boolean(item));
}

function asRotation(value: Json) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) =>
      isRecord(item) && typeof item.text === "string"
        ? { step: typeof item.step === "number" ? item.step : index + 1, text: item.text }
        : null,
    )
    .filter((item): item is { step: number; text: string } => Boolean(item));
}

function textToRotation(value: string) {
  return value
    .split(/\r?\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({ step: index + 1, text }));
}

async function checked<T>(promise: PromiseLike<{ data: T | null; error: unknown }>, label: string) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
  return data;
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
