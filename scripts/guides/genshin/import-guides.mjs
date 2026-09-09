import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "node-html-parser";
import { createClient } from "@supabase/supabase-js";

const GAME_ID = "genshin-impact";
const NANOKA_HOME = "https://gi.nanoka.cc/";
const ICY_BASE = "https://www.icy-veins.com/genshin-impact/";
const ICY_SOURCE_ROOT =
  process.env.GENSHIN_ICYVEINS_SOURCE_ROOT ??
  "D:\\IcyVeins-Guide\\Genshin-Impact-Guides\\character-intros";
const USER_AGENT = "Mozilla/5.0 PlaydexGuideImporter/1.0";
const SAMPLE_NAMES = new Set(["Chasca", "Alyosha", "Odette", "Furina", "Neuvillette"]);

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = new Set(process.argv.slice(2));
const explicitLimit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 0);
const explicitConcurrency = Number(process.argv.find((arg) => arg.startsWith("--concurrency="))?.split("=")[1] ?? 0);
const sampleOnly = args.has("--sample");
const scope = sampleOnly ? "sample" : explicitLimit > 0 ? `limit:${explicitLimit}` : "full";
const concurrency = Math.max(1, Math.min(12, explicitConcurrency || (sampleOnly ? 3 : 6)));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for guide import.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const icyContentIndex = buildIcyContentIndex(ICY_SOURCE_ROOT);
const assetIndexes = {
  characters: buildAssetIndex("characters"),
  weapons: buildAssetIndex("weapons"),
  artifacts: buildAssetIndex("artifacts"),
};

const report = {
  scope,
  concurrency,
  nanokaVersion: null,
  icySourceRoot: ICY_SOURCE_ROOT,
  processedCharacters: 0,
  charactersUpserted: 0,
  kitsSucceeded: 0,
  buildsSucceeded: 0,
  teamsSucceeded: 0,
  missingNanokaPages: [],
  missingBuildFiles: [],
  missingTeamFiles: [],
  parsingFailures: [],
  unresolvedAssets: {
    characters: [],
    weapons: [],
    artifacts: [],
  },
  missing: [],
  failed: [],
};

const runId = await startRun();

try {
  await seedGuideSources();

  const nanokaVersion = await discoverNanokaVersion();
  report.nanokaVersion = nanokaVersion;
  const roster = await fetchNanokaRoster(nanokaVersion);
  const releasedRoster = roster.filter((character) => isReleased(character.releaseDate));
  const selectedRoster = selectRoster(releasedRoster);
  const characters = [];

  await updateGuideSource("genshin-impact-nanoka-roster", "healthy", null);

  for (const rosterCharacter of selectedRoster) {
    try {
      const character = await upsertCharacter(rosterCharacter, nanokaVersion);
      characters.push({ character, rosterCharacter });
      report.charactersUpserted += 1;
    } catch (error) {
      report.failed.push({
        character: rosterCharacter.name,
        source: "upsert-character",
        error: error.message,
      });
    }
  }

  const aliasesByName = buildCharacterAliasMap(characters.map((entry) => entry.character));

  await runLimited(characters, concurrency, async ({ character, rosterCharacter }, index, total) => {
    console.error(`[guides] ${index + 1}/${total} ${character.name}`);
    await importNanokaKit(character, rosterCharacter, nanokaVersion);
    await importIcyBuild(character);
    await importIcyTeams(character, aliasesByName);
    report.processedCharacters += 1;
  });

  compactReport();
  await finishRun(runId, report.failed.length || report.parsingFailures.length ? "partial" : "completed");
  printReport();
} catch (error) {
  report.failed.push({ source: "import-run", error: error.message });
  compactReport();
  await finishRun(runId, "failed");
  printReport();
  throw error;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim().replace(/^export\s+/, "");
    if (process.env[key]) continue;

    let value = rawValue.join("=").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function fetchText(url) {
  const response = await fetchWithRetry(url, {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "user-agent": USER_AGENT,
  });
  return response.text();
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url, {
    accept: "application/json,*/*;q=0.8",
    "user-agent": USER_AGENT,
  });
  return response.json();
}

async function fetchWithRetry(url, headers, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const error = new Error(`Fetch failed ${response.status} for ${url}`);
        error.status = response.status;
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (error.status === 404 || error.status === 403 || attempt === attempts) break;
      await delay(500 * attempt);
    }
  }

  throw lastError;
}

async function discoverNanokaVersion() {
  const html = await fetchText(NANOKA_HOME);
  const match = html.match(/https:\/\/static\.nanoka\.cc\/gi\/([^/]+)\/character\.json/);
  if (!match) throw new Error("Could not discover Nanoka data version.");
  return match[1];
}

async function fetchNanokaRoster(version) {
  const data = await fetchJson(`https://static.nanoka.cc/gi/${version}/character.json`);
  const rawRoster = Object.entries(data)
    .map(([sourceId, item]) => {
      const baseName = item.en;
      const element = item.element ?? null;
      return {
        sourceId,
        baseName,
        name: baseName,
        slug: slugify(baseName ?? sourceId),
        displayName: baseName,
        rarity: rarityFromRank(item.rank),
        element,
        weaponType: weaponTypeFromNanoka(item.weapon),
        releaseDate: parseNanokaDate(item.release),
        iconKey: item.icon ?? null,
        release: item.release ?? null,
        metadata: {
          birthday: item.birth ?? null,
          nanokaRank: item.rank ?? null,
          nanokaWeapon: item.weapon ?? null,
        },
        rawWeapon: item.weapon ?? null,
      };
    })
    .filter((item) => item.name && item.element !== "None" && item.rawWeapon !== "WEAPON_CROSSBOW");

  const dedupedRoster = [];
  const seenIdentities = new Set();
  for (const item of rawRoster) {
    const identityKey = normalizeAlias(`${item.baseName} ${item.element} ${item.rawWeapon}`);
    if (seenIdentities.has(identityKey)) continue;
    seenIdentities.add(identityKey);
    dedupedRoster.push(item);
  }

  const nameCounts = new Map();
  for (const item of dedupedRoster) {
    nameCounts.set(item.baseName, (nameCounts.get(item.baseName) ?? 0) + 1);
  }

  return dedupedRoster.map((item) => {
    const hasElementVariants = (nameCounts.get(item.baseName) ?? 0) > 1;
    const displayName = hasElementVariants ? `${item.baseName} (${item.element})` : item.baseName;
    return {
      ...item,
      name: item.baseName,
      displayName,
      slug: hasElementVariants ? `${slugify(item.baseName)}-${slugify(item.element)}` : slugify(item.baseName),
      aliases: uniqueAliases(
        hasElementVariants
          ? [displayName, `${item.element} ${item.baseName}`, `${item.baseName} ${item.element}`]
          : [item.baseName],
      ),
      metadata: {
        ...item.metadata,
        baseName: item.baseName,
        hasElementVariants,
      },
    };
  });
}

function selectRoster(roster) {
  if (sampleOnly) return roster.filter((character) => SAMPLE_NAMES.has(character.name)).slice(0, 5);
  if (explicitLimit > 0) return roster.slice(0, explicitLimit);
  return roster;
}

function isReleased(dateString) {
  if (!dateString) return false;
  return new Date(`${dateString}T00:00:00Z`).getTime() <= Date.now();
}

async function upsertCharacter(rosterCharacter, nanokaVersion) {
  const characterAsset = resolveAsset("characters", characterAssetCandidates(rosterCharacter));
  if (!characterAsset.path) addUnresolvedAsset("characters", rosterCharacter.displayName, characterAsset.candidates);

  const character = {
    id: `${GAME_ID}-${rosterCharacter.slug}`,
    game_id: GAME_ID,
    slug: rosterCharacter.slug,
    name: rosterCharacter.displayName,
    display_name: rosterCharacter.displayName,
    source_character_id: rosterCharacter.sourceId,
    rarity: rosterCharacter.rarity,
    element: rosterCharacter.element,
    weapon_type: rosterCharacter.weaponType,
    release_date: rosterCharacter.releaseDate,
    icon_key: rosterCharacter.iconKey,
    portrait_url: characterAsset.path,
    is_playable: true,
    metadata: {
      ...rosterCharacter.metadata,
      source: "nanoka",
      nanokaVersion,
      localAssetCandidates: characterAsset.candidates,
    },
  };

  await checked(
    supabase.from("game_characters").upsert(character, { onConflict: "id" }),
    `upsert character ${rosterCharacter.name}`,
  );

  await checked(
    supabase.from("character_aliases").upsert(
      rosterCharacter.aliases.map((alias) => ({
        character_id: character.id,
        game_id: GAME_ID,
        alias,
        normalized_alias: normalizeAlias(alias),
        source_site: "nanoka",
        source_character_id: rosterCharacter.sourceId,
        source_slug: rosterCharacter.slug,
        source_url: `${NANOKA_HOME}character/${rosterCharacter.sourceId}`,
      })),
      { onConflict: "game_id,source_site,normalized_alias" },
    ),
    `upsert alias ${rosterCharacter.name}`,
  );

  return { ...character, source_name: rosterCharacter.name };
}

async function importNanokaKit(character, rosterCharacter, version) {
  const sourceUrl = `https://gi.nanoka.cc/character/${rosterCharacter.sourceId}`;
  const jsonUrl = `https://static.nanoka.cc/gi/${version}/en/character/${rosterCharacter.sourceId}.json`;
  const sourceRecordId = `${character.id}-nanoka-kit`;

  try {
    const data = await fetchJson(jsonUrl);
    const skills = Array.isArray(data.skills) ? data.skills : Object.values(data.skills ?? {});
    const passives = Array.isArray(data.passives) ? data.passives : Object.values(data.passives ?? {});
    const constellations = Array.isArray(data.constellations)
      ? data.constellations
      : Object.values(data.constellations ?? {});

    const normalAttack = normalizeKitEntry(skills[0], "normal_attack", 1);
    const elementalSkill = normalizeKitEntry(skills[1], "elemental_skill", 2);
    const elementalBurst = normalizeKitEntry(skills[2], "elemental_burst", 3);
    const normalizedPassives = passives.map((entry, index) => normalizeKitEntry(entry, "passive_talent", index + 1));
    const normalizedConstellations = constellations.map((entry, index) =>
      normalizeKitEntry(entry, "constellation", index + 1),
    );
    const ruleTerms = extractRuleTerms([
      normalAttack,
      elementalSkill,
      elementalBurst,
      ...normalizedPassives,
      ...normalizedConstellations,
    ]);

    const missingFields = [];
    if (!normalAttack) missingFields.push("normal_attack");
    if (!elementalSkill) missingFields.push("elemental_skill");
    if (!elementalBurst) missingFields.push("elemental_burst");
    if (!normalizedPassives.length) missingFields.push("passive_talents");
    if (!normalizedConstellations.length) missingFields.push("constellations");
    if (!ruleTerms.length) missingFields.push("rule_terms");
    const missingRequiredFields = missingFields.filter((field) => field !== "rule_terms");

    const contentHash = hashJson({
      normalAttack,
      elementalSkill,
      elementalBurst,
      normalizedPassives,
      normalizedConstellations,
      ruleTerms,
    });

    await upsertSourceRecord({
      id: sourceRecordId,
      characterId: character.id,
      guideSourceId: "genshin-impact-nanoka-kit",
      sourceSite: "nanoka",
      sourceType: "kit",
      sourceUrl,
      sourceCharacterId: rosterCharacter.sourceId,
      sourceSlug: rosterCharacter.slug,
      status: missingRequiredFields.length ? "partial" : "success",
      contentHash,
      missingFields,
      metadata: { jsonUrl, nanokaVersion: version },
    });

    await checked(
      supabase.from("character_kits").upsert(
        {
          id: `${character.id}-kit`,
          character_id: character.id,
          guide_source_record_id: sourceRecordId,
          source_site: "nanoka",
          source_url: sourceUrl,
          source_version: version,
          normal_attack: normalAttack,
          elemental_skill: elementalSkill,
          elemental_burst: elementalBurst,
          passive_talents: normalizedPassives,
          constellations: normalizedConstellations,
          rule_terms: ruleTerms,
          imported_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      ),
      `upsert Nanoka kit ${character.name}`,
    );

    await updateGuideSource("genshin-impact-nanoka-kit", missingRequiredFields.length ? "partial" : "healthy", null);
    report.kitsSucceeded += 1;
  } catch (error) {
    await upsertSourceRecord({
      id: sourceRecordId,
      characterId: character.id,
      guideSourceId: "genshin-impact-nanoka-kit",
      sourceSite: "nanoka",
      sourceType: "kit",
      sourceUrl,
      sourceCharacterId: rosterCharacter.sourceId,
      sourceSlug: rosterCharacter.slug,
      status: "failed",
      error: error.message,
      metadata: { jsonUrl, nanokaVersion: version },
    });
    await updateGuideSource("genshin-impact-nanoka-kit", "partial", error.message);
    report.missingNanokaPages.push({ character: character.name, url: jsonUrl, reason: error.message });
    report.failed.push({ character: character.name, source: "nanoka", error: error.message });
  }
}

async function importIcyBuild(character) {
  const sourceName = character.source_name ?? character.name;
  const sourceSlug = icySlug(sourceName, character.slug, character);
  const sourceRecordId = `${character.id}-icy-veins-build`;
  const sourceFile = findIcyFile(character, "build");

  if (!sourceFile) {
    await markMissingBuild(character, sourceRecordId, sourceSlug, "Icy Veins local build file missing.");
    return;
  }

  const sourceUrl = pathToFileURL(sourceFile).href;

  try {
    const html = readFileSync(sourceFile, "utf8");
    const root = parse(html);
    const build = parseIcyBuildGuide(html, root);

    if (!build.hasStructuredData) {
      await markMissingBuild(character, sourceRecordId, sourceSlug, "Icy Veins local build structure missing.", sourceFile);
      return;
    }

    const missingFields = [];
    if (!build.bestWeapons?.length) missingFields.push("best_weapons");
    if (!build.bestArtifacts?.length) missingFields.push("best_artifacts");
    if (!build.mainStats) missingFields.push("main_stats");
    if (!build.substatPriority?.length) missingFields.push("substat_priority");
    if (!build.talentPriority?.length) missingFields.push("talent_priority");

    const enrichedBuild = {
      ...build,
      bestWeapons: withAssetPaths(build.bestWeapons, "weapons"),
      alternativeWeapons: withAssetPaths(build.alternativeWeapons, "weapons"),
      f2pWeapons: withAssetPaths(build.f2pWeapons, "weapons"),
      bestArtifacts: withAssetPaths(build.bestArtifacts, "artifacts"),
      alternativeArtifacts: withAssetPaths(build.alternativeArtifacts, "artifacts"),
    };
    const contentHash = hashJson(enrichedBuild);

    await upsertSourceRecord({
      id: sourceRecordId,
      characterId: character.id,
      guideSourceId: "genshin-impact-icy-veins-build",
      sourceSite: "icy-veins",
      sourceType: "build",
      sourceUrl,
      sourceCharacterId: character.source_character_id,
      sourceSlug,
      status: missingFields.length ? "partial" : "success",
      contentHash,
      missingFields,
      metadata: { sourceSlug, relativePath: relative(process.cwd(), sourceFile) },
    });

    await checked(
      supabase.from("character_builds").upsert(
        {
          id: `${character.id}-icy-veins-default`,
          character_id: character.id,
          guide_source_record_id: sourceRecordId,
          source_site: "icy-veins",
          source_url: sourceUrl,
          build_name: "Default",
          role: enrichedBuild.role,
          best_weapons: enrichedBuild.bestWeapons,
          alternative_weapons: enrichedBuild.alternativeWeapons,
          f2p_weapons: enrichedBuild.f2pWeapons,
          best_artifacts: enrichedBuild.bestArtifacts,
          alternative_artifacts: enrichedBuild.alternativeArtifacts,
          main_stats: enrichedBuild.mainStats,
          substat_priority: enrichedBuild.substatPriority,
          talent_priority: enrichedBuild.talentPriority,
          energy_recharge: enrichedBuild.energyRecharge,
          rotation: enrichedBuild.rotation,
          structured_sections: enrichedBuild.structuredSections,
          imported_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      ),
      `upsert Icy Veins build ${character.name}`,
    );

    await updateGuideSource("genshin-impact-icy-veins-build", missingFields.length ? "partial" : "healthy", null);
    report.buildsSucceeded += 1;
  } catch (error) {
    await upsertSourceRecord({
      id: sourceRecordId,
      characterId: character.id,
      guideSourceId: "genshin-impact-icy-veins-build",
      sourceSite: "icy-veins",
      sourceType: "build",
      sourceUrl,
      sourceCharacterId: character.source_character_id,
      sourceSlug,
      status: "failed",
      error: error.message,
      metadata: { sourceSlug, relativePath: relative(process.cwd(), sourceFile) },
    });
    await updateGuideSource("genshin-impact-icy-veins-build", "partial", error.message);
    report.parsingFailures.push({ character: character.name, source: "icy-veins-build", file: sourceFile, error: error.message });
  }
}

async function markMissingBuild(character, sourceRecordId, sourceSlug, reason, sourceFile = null) {
  await checked(
    supabase.from("character_builds").delete().eq("character_id", character.id).eq("source_site", "icy-veins"),
    `clear old Icy Veins build ${character.name}`,
  );
  await upsertSourceRecord({
    id: sourceRecordId,
    characterId: character.id,
    guideSourceId: "genshin-impact-icy-veins-build",
    sourceSite: "icy-veins",
    sourceType: "build",
    sourceUrl: sourceFile ? pathToFileURL(sourceFile).href : `${ICY_BASE}${sourceSlug}`,
    sourceCharacterId: character.source_character_id,
    sourceSlug,
    status: "missing",
    error: reason,
    missingFields: ["character_build"],
    metadata: { sourceSlug, relativePath: sourceFile ? relative(process.cwd(), sourceFile) : null },
  });
  await updateGuideSource("genshin-impact-icy-veins-build", "partial", reason);
  report.missingBuildFiles.push({ character: character.name, sourceSlug, reason });
  report.missing.push({ character: character.name, source: "icy-veins-build", reason });
}

async function importIcyTeams(character, aliasesByName) {
  const sourceName = character.source_name ?? character.name;
  const sourceSlug = icySlug(sourceName, character.slug, character);
  const sourceRecordId = `${character.id}-icy-veins-team`;
  const teamsFile = findIcyFile(character, "teams");
  const sourceFile = teamsFile ?? findIcyFile(character, "build");

  if (!sourceFile) {
    await markMissingTeams(character, sourceRecordId, sourceSlug, "Icy Veins local teams file missing.");
    return;
  }

  const sourceUrl = pathToFileURL(sourceFile).href;

  try {
    const html = readFileSync(sourceFile, "utf8");
    const root = parse(html);
    const teams = parseIcyTeams(html, root, sourceName, Boolean(teamsFile));

    if (!teams.length) {
      await markMissingTeams(character, sourceRecordId, sourceSlug, "Icy Veins local team data missing.", sourceFile);
      return;
    }

    const contentHash = hashJson(teams);
    await upsertSourceRecord({
      id: sourceRecordId,
      characterId: character.id,
      guideSourceId: "genshin-impact-icy-veins-team",
      sourceSite: "icy-veins",
      sourceType: "team",
      sourceUrl,
      sourceCharacterId: character.source_character_id,
      sourceSlug,
      status: "success",
      contentHash,
      metadata: { teamCount: teams.length, relativePath: relative(process.cwd(), sourceFile) },
    });

    await clearOldTeams(character);

    for (const team of teams) {
      const teamId = `${character.id}-icy-veins-team-${team.rankOrder}`;
      await checked(
        supabase.from("character_team_comps").upsert(
          {
            id: teamId,
            character_id: character.id,
            guide_source_record_id: sourceRecordId,
            source_site: "icy-veins",
            source_url: sourceUrl,
            team_name: team.teamName,
            team_type: team.teamType,
            rank_order: team.rankOrder,
            description: team.description,
            metadata: {
              sourceHeaders: team.headers,
              sourceKind: team.sourceKind,
              alternatives: team.members.flatMap((member) => member.alternatives),
            },
            imported_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        ),
        `upsert Icy Veins team ${character.name} #${team.rankOrder}`,
      );

      for (const member of team.members) {
        const linkedCharacter = aliasesByName.get(normalizeAlias(member.characterName));
        const characterAsset = resolveAsset("characters", characterNameCandidates(member.characterName));
        if (!characterAsset.path) addUnresolvedAsset("characters", member.characterName, characterAsset.candidates);
        await checked(
          supabase.from("character_team_members").upsert(
            {
              team_id: teamId,
              slot_number: member.slotNumber,
              character_id: linkedCharacter?.id ?? null,
              character_name: member.characterName,
              role: member.role,
              is_flex: member.isFlex,
              alternatives: member.alternatives,
              metadata: {
                assetPath: characterAsset.path,
                sourceText: member.sourceText,
              },
            },
            { onConflict: "team_id,slot_number" },
          ),
          `upsert Icy Veins team member ${member.characterName}`,
        );
      }
    }

    await updateGuideSource("genshin-impact-icy-veins-team", "healthy", null);
    report.teamsSucceeded += 1;
  } catch (error) {
    await upsertSourceRecord({
      id: sourceRecordId,
      characterId: character.id,
      guideSourceId: "genshin-impact-icy-veins-team",
      sourceSite: "icy-veins",
      sourceType: "team",
      sourceUrl,
      sourceCharacterId: character.source_character_id,
      sourceSlug,
      status: "failed",
      error: error.message,
      metadata: { sourceSlug, relativePath: relative(process.cwd(), sourceFile) },
    });
    await updateGuideSource("genshin-impact-icy-veins-team", "partial", error.message);
    report.parsingFailures.push({ character: character.name, source: "icy-veins-team", file: sourceFile, error: error.message });
  }
}

async function markMissingTeams(character, sourceRecordId, sourceSlug, reason, sourceFile = null) {
  await clearOldTeams(character);
  await upsertSourceRecord({
    id: sourceRecordId,
    characterId: character.id,
    guideSourceId: "genshin-impact-icy-veins-team",
    sourceSite: "icy-veins",
    sourceType: "team",
    sourceUrl: sourceFile ? pathToFileURL(sourceFile).href : `${ICY_BASE}${sourceSlug}-teams`,
    sourceCharacterId: character.source_character_id,
    sourceSlug,
    status: "missing",
    error: reason,
    missingFields: ["character_teams"],
    metadata: { sourceSlug, relativePath: sourceFile ? relative(process.cwd(), sourceFile) : null },
  });
  await updateGuideSource("genshin-impact-icy-veins-team", "partial", reason);
  report.missingTeamFiles.push({ character: character.name, sourceSlug, reason });
  report.missing.push({ character: character.name, source: "icy-veins-team", reason });
}

async function clearOldTeams(character) {
  await checked(
    supabase.from("character_team_comps").delete().eq("character_id", character.id).in("source_site", ["ign", "icy-veins"]),
    `clear old teams ${character.name}`,
  );
}

function parseIcyBuildGuide(html, root) {
  const buildTable = root.querySelector("table.genshin_build");
  const namedSections = splitIcySections(html);
  const structuredSections = {};

  let bestWeapons = [];
  let alternativeWeapons = [];
  let f2pWeapons = [];
  let bestArtifacts = [];
  let alternativeArtifacts = [];
  let mainStats = null;
  let substatPriority = [];
  let talentPriority = [];
  let energyRecharge = null;

  if (buildTable) {
    for (const row of buildTable.querySelectorAll("tr")) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) continue;

      const label = cleanIcyText(cells[0].innerHTML);
      structuredSections[label] = {
        text: cleanIcyText(cells[1].innerHTML),
        rankedItems: extractRankedItems(cells[1]),
      };
    }

    bestWeapons = pickRanked(structuredSections, ["BiS Weapon", "Best Weapon", "Best Weapons"]);
    alternativeWeapons = pickRanked(structuredSections, ["Alternative Weapons", "Weapon Replacements"]);
    f2pWeapons = pickRankedByIncludes(structuredSections, ["f2p", "free-to-play"]);
    bestArtifacts = pickRanked(structuredSections, ["Best Artifacts", "Best Artifact Set"]);
    alternativeArtifacts = pickRankedByIncludes(structuredSections, ["alternative artifact", "artifact replacement"]);
    mainStats = parseMainStats(getSectionText(structuredSections, "Main Stats"));
    substatPriority = pickRanked(structuredSections, ["Substat Priority"]);
    talentPriority = pickRanked(structuredSections, ["Talent Priority"]);
    energyRecharge = extractEnergyRecharge(structuredSections);
  }

  const weaponDropdowns = extractDropdownItems(namedSections.weapons ?? "");
  if (!bestWeapons.length && weaponDropdowns.length) bestWeapons = weaponDropdowns;

  const artifactDropdowns = extractDropdownItems(namedSections.artifacts ?? "");
  if (!bestArtifacts.length && artifactDropdowns.length) {
    bestArtifacts = artifactDropdowns.slice(0, 1);
    alternativeArtifacts = artifactDropdowns.slice(1);
  }

  const statBlocks = extractSmallStatBlocks(namedSections.stat_priority ?? "");
  if (!mainStats && statBlocks.length) mainStats = parseMainStats(statBlocks.join("\n"));
  if (!substatPriority.length && statBlocks.length) substatPriority = parseSubstatPriority(statBlocks.join("\n"));
  if (!talentPriority.length) talentPriority = parseTalentPriority(namedSections.talent_priority ?? "");

  const recommendedStats = extractSmallStatBlocks(namedSections.recommended_stats ?? "").map(parseKeyValueBlock);
  const bestConstellations = cleanIcyText(namedSections.best_constellations ?? "");
  const investmentPriority = parseInvestmentPriority(namedSections.best_constellations ?? "");
  const buildOptions = extractBuildOptions(root);
  const playstyle = cleanIcyText(namedSections.playstyle ?? "");
  const rotation = extractRotationFromSection(namedSections.playstyle ?? "", root);

  structuredSections.localIcy = {
    buildOptions,
    recommendedStats,
    bestConstellations,
    investmentPriority,
    playstyle,
    sourceSections: Object.keys(namedSections),
  };

  return {
    role: null,
    bestWeapons,
    alternativeWeapons,
    f2pWeapons,
    bestArtifacts,
    alternativeArtifacts,
    mainStats,
    substatPriority,
    talentPriority,
    energyRecharge: energyRecharge ?? extractEnergyRechargeFromText(namedSections.recommended_stats ?? html),
    rotation,
    structuredSections,
    hasStructuredData:
      Boolean(buildTable) ||
      weaponDropdowns.length > 0 ||
      artifactDropdowns.length > 0 ||
      statBlocks.length > 0 ||
      talentPriority.length > 0,
  };
}

function parseIcyTeams(html, root, guideCharacterName, isDedicatedTeamsFile) {
  const teamHtml = isDedicatedTeamsFile ? html : extractEmbeddedTeamHtml(html);
  const teamRoot = isDedicatedTeamsFile ? root : parse(teamHtml);
  const teams = [];
  teams.push(...extractIcyTeamCompositionMacros(teamHtml, guideCharacterName));
  teams.push(...extractIcyTeamTables(teamRoot, guideCharacterName, teams.length));
  return teams;
}

function extractEmbeddedTeamHtml(html) {
  const headingMatch = html.match(/<h[12][^>]*>[^<]*Team[^<]*(?:Comp|Example|Composition)[^<]*<\/h[12]>/i);
  if (headingMatch?.index == null) return "";

  const start = headingMatch.index;
  const endCandidates = [
    html.indexOf('<div class="image_block"', start),
    html.indexOf("@@@Section:", start + headingMatch[0].length),
    html.indexOf("<h1", start + headingMatch[0].length),
  ].filter((index) => index > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : html.length;
  return html.slice(start, end);
}

function extractIcyTeamCompositionMacros(html, guideCharacterName) {
  const lines = html.split(/\r?\n/);
  const teams = [];
  let currentTeamType = null;

  for (const line of lines) {
    const headingMatch = line.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (headingMatch) currentTeamType = cleanIcyText(headingMatch[1]);

    for (const match of line.matchAll(/@@@TeamComposition:\s*([^@]+?)@@@/g)) {
      const names = splitMacroList(match[1]);
      if (!names.length) continue;
      const rankOrder = teams.length + 1;
      teams.push({
        rankOrder,
        teamName: currentTeamType ? `${currentTeamType} ${rankOrder}` : `${guideCharacterName} Team ${rankOrder}`,
        teamType: currentTeamType,
        description: null,
        headers: [],
        sourceKind: "team-composition-macro",
        members: names.map((characterName, index) => ({
          slotNumber: index + 1,
          characterName,
          role: null,
          isFlex: false,
          alternatives: [],
          sourceText: match[0],
        })),
      });
    }
  }

  return teams;
}

function extractIcyTeamTables(root, guideCharacterName, offset = 0) {
  const tables = root.querySelectorAll("table.genshin_team_comp");
  const teams = [];

  for (const table of tables) {
    const headers = table.querySelectorAll("tr")[0]?.querySelectorAll("th,td").map((cell) => cleanIcyText(cell.innerHTML)) ?? [];
    if (headers.length < 2) continue;

    const teamType = previousHeadingText(table) ?? headers.join(" / ");
    for (const row of table.querySelectorAll("tr").slice(1)) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) continue;

      const members = cells
        .map((cell, index) => {
          const names = extractCharacterNamesFromHtml(cell.innerHTML);
          const primary = names[0] ?? cleanIcyText(cell.innerHTML);
          return {
            slotNumber: index + 1,
            characterName: primary,
            role: headers[index] ?? null,
            isFlex: names.length > 1,
            alternatives: names.slice(1),
            sourceText: cleanIcyText(cell.innerHTML),
          };
        })
        .filter((member) => member.characterName);

      if (!members.length) continue;

      const rankOrder = offset + teams.length + 1;
      teams.push({
        rankOrder,
        teamName: `${teamType} ${rankOrder}`,
        teamType,
        description: null,
        headers,
        sourceKind: "genshin-team-table",
        members,
      });
    }
  }

  return teams;
}

function normalizeKitEntry(entry, type, rank) {
  if (!entry) return null;
  const rawDescription = entry.desc ?? entry.description ?? "";
  const normalizedRawDescription = normalizeLayoutHints(rawDescription);
  return {
    id: String(entry.id ?? `${type}-${rank}`),
    type,
    rank,
    name: entry.name ?? entry.title ?? type,
    description: cleanRichText(normalizedRawDescription),
    rawDescription: normalizedRawDescription,
  };
}

function extractRuleTerms(entries) {
  const terms = new Map();
  for (const entry of entries.filter(Boolean)) {
    for (const match of entry.rawDescription.matchAll(/<color=[^>]+>(.*?)<\/color>/g)) {
      const term = cleanRichText(match[1]);
      if (term && !terms.has(normalizeAlias(term))) terms.set(normalizeAlias(term), { term });
    }
  }
  return [...terms.values()];
}

function extractRankedItems(cell) {
  const listItems = cell.querySelectorAll("ol li, ul li");
  const nodes = listItems.length ? listItems : [cell];

  return nodes
    .flatMap((node, index) => {
      const dropdowns = extractDropdownItems(node.innerHTML);
      if (dropdowns.length) return dropdowns.map((item, itemIndex) => ({ ...item, rank: index + itemIndex + 1 }));

      const names = extractItemNamesFromHtml(node.innerHTML);
      if (names.length) return names.map((name, itemIndex) => ({ rank: index + itemIndex + 1, name, sourceRef: null }));

      const text = cleanIcyText(node.innerHTML);
      return text ? [{ rank: index + 1, name: text, sourceRef: null }] : [];
    })
    .filter((item) => item.name);
}

function extractDropdownItems(html) {
  return html
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@@@DropdownStart:"))
    .map((line, index) => {
      const imageMatch = line.match(/IMG_GENSHIN:([^,\s]+)/);
      const macroMatch = line.match(/,\s*(@@@Genshin[^@]+@@@|[^,]+?)\s*,/);
      const imagePath = imageMatch?.[1] ?? null;
      const name = cleanIcyText(macroMatch?.[1] ?? slugToTitle(basename(imagePath ?? "", extname(imagePath ?? ""))));
      const extra = line
        .replace(/^@@@DropdownStart:\s*/, "")
        .replace(/\s*@@@$/, "")
        .split(",")
        .slice(2)
        .map((part) => cleanIcyText(part))
        .filter(Boolean);

      return {
        rank: index + 1,
        name,
        sourceRef: imagePath,
        refinement: extra[0] ?? null,
        value: extra[1] ?? null,
      };
    })
    .filter((item) => item.name);
}

function extractItemNamesFromHtml(html) {
  const names = [];
  for (const match of html.matchAll(/@@@(Genshin[A-Za-z0-9]+)@@@/g)) {
    const macro = match[1];
    if (shouldSkipGenshinMacro(macro)) continue;
    names.push(macroToText(macro));
  }
  return uniqueAliases(names);
}

function extractCharacterNamesFromHtml(html) {
  const names = [];
  for (const match of html.matchAll(/@@@(Genshin[A-Za-z0-9]+(?:PortraitWithLink|Portrait|WithIcon|WithLink)?)@@@/g)) {
    const macro = match[1];
    if (!/(Portrait|WithIcon|WithLink)$/i.test(macro)) continue;
    names.push(macroToText(macro));
  }
  if (!names.length) {
    const cleaned = cleanIcyText(html);
    if (cleaned) names.push(cleaned);
  }
  return uniqueAliases(names);
}

function shouldSkipGenshinMacro(macro) {
  return /Description$|Icon(Sands|Goblet|Circlet)$|^(GenshinSands|GenshinGoblet|GenshinCirclet)$/.test(macro);
}

function splitIcySections(html) {
  const sections = {};
  const regex = /@@@Section:([^@]+?)@@@/g;
  const matches = [...html.matchAll(regex)];
  for (let index = 0; index < matches.length; index += 1) {
    const name = matches[index][1].trim();
    const start = matches[index].index + matches[index][0].length;
    const end = matches[index + 1]?.index ?? html.length;
    sections[name] = html.slice(start, end);
  }
  return sections;
}

function extractSmallStatBlocks(html) {
  return [...html.matchAll(/@@@SmallStatBlockStart@@@([\s\S]*?)@@@SmallStatBlockEnd@@@/g)]
    .map((match) => cleanIcyText(match[1]))
    .filter(Boolean);
}

function parseMainStats(text) {
  if (!text) return null;
  const result = {};
  const normalized = cleanIcyText(text);
  const linePatterns = [
    ["sand", /(?:Sand|Sands)(?:\s+Stats)?:\s*(.*)/i],
    ["goblet", /Goblet(?:\s+Stats)?:\s*(.*)/i],
    ["circlet", /Circlet(?:\s+Stats)?:\s*(.*)/i],
  ];

  for (const line of normalized.split(/\n+/)) {
    for (const [key, pattern] of linePatterns) {
      const match = line.match(pattern);
      if (match) result[key] = match[1].trim();
    }
  }

  if (Object.keys(result).length) return result;

  const matches = [...normalized.matchAll(/(Sand|Sands|Goblet|Circlet) Stats:\s*(.*?)(?=(Sand|Sands|Goblet|Circlet) Stats:|$)/gi)];
  for (const match of matches) {
    result[match[1].toLowerCase().replace("sands", "sand")] = match[2].trim();
  }
  return Object.keys(result).length ? result : { raw: normalized };
}

function parseSubstatPriority(text) {
  const block = cleanIcyText(text);
  const line = block.split(/\n+/).find((item) => /^Substats?:/i.test(item));
  if (!line) return [];
  return splitPriorityLine(line.replace(/^Substats?:/i, ""));
}

function parseTalentPriority(html) {
  const blocks = extractSmallStatBlocks(html);
  const source = blocks.join("\n") || cleanIcyText(html);
  const line = source.split(/\n+/).find((item) => /Talent Priority:/i.test(item)) ?? source;
  return splitPriorityLine(line.replace(/Talent Priority:/i, ""));
}

function parseInvestmentPriority(html) {
  const blocks = extractSmallStatBlocks(html);
  const source = blocks.join("\n") || cleanIcyText(html);
  const line = source.split(/\n+/).find((item) => /Investment Priority:/i.test(item));
  return line ? splitPriorityLine(line.replace(/Investment Priority:/i, "")) : [];
}

function splitPriorityLine(value) {
  return cleanIcyText(value)
    .split(/\s*(?:>{1,3}|->|,)\s*/)
    .map((name, index) => ({ rank: index + 1, name: name.trim(), sourceRef: null }))
    .filter((item) => item.name);
}

function parseKeyValueBlock(block) {
  const result = {};
  for (const line of cleanIcyText(block).split(/\n+/)) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) result[key.trim()] = rest.join(":").trim();
  }
  return Object.keys(result).length ? result : { raw: cleanIcyText(block) };
}

function extractBuildOptions(root) {
  return root
    .querySelectorAll(".genshin-build-switch_label")
    .map((node, index) => ({ id: index + 1, name: cleanIcyText(node.innerHTML) }))
    .filter((option) => option.name);
}

function extractEnergyRecharge(sections) {
  for (const [label, section] of Object.entries(sections)) {
    if (/energy recharge|er requirement/i.test(label) || /energy recharge/i.test(section.text)) return section.text;
  }
  return null;
}

function extractEnergyRechargeFromText(value) {
  const text = cleanIcyText(value);
  const lines = text.split(/\n+/).filter((line) => /energy recharge|ER requirement/i.test(line));
  return lines.length ? lines.join("\n") : null;
}

function extractRotationFromSection(sectionHtml, root) {
  const sectionText = cleanIcyText(sectionHtml);
  const rotationLines = sectionText.split(/\n+/).filter((line) => /rotation|combo|sequence/i.test(line));
  if (rotationLines.length) return rotationLines.map((text, index) => ({ step: index + 1, text }));

  const heading = root.querySelectorAll("h2,h3,h4").find((item) => /rotation|combo/i.test(item.structuredText));
  if (!heading) return null;

  const rotation = [];
  let node = heading.nextElementSibling;
  while (node && !["H1", "H2", "H3"].includes(node.tagName)) {
    const listItems = node.querySelectorAll("ol li, ul li");
    if (listItems.length) {
      rotation.push(...listItems.map((item, index) => ({ step: rotation.length + index + 1, text: cleanIcyText(item.innerHTML) })));
    }
    node = node.nextElementSibling;
  }

  return rotation.length ? rotation : null;
}

function pickRanked(sections, labels) {
  for (const label of labels) {
    if (sections[label]?.rankedItems?.length) return sections[label].rankedItems;
  }
  return [];
}

function pickRankedByIncludes(sections, terms) {
  for (const [label, section] of Object.entries(sections)) {
    if (terms.some((term) => label.toLowerCase().includes(term)) && section.rankedItems?.length) return section.rankedItems;
  }
  return [];
}

function getSectionText(sections, label) {
  return sections[label]?.text ?? "";
}

function previousHeadingText(node) {
  let current = node.previousElementSibling;
  while (current) {
    if (["H1", "H2", "H3", "H4"].includes(current.tagName)) return cleanIcyText(current.innerHTML);
    current = current.previousElementSibling;
  }
  return null;
}

async function upsertSourceRecord(record) {
  await checked(
    supabase.from("character_guide_source_records").upsert(
      {
        id: record.id,
        game_id: GAME_ID,
        character_id: record.characterId,
        guide_source_id: record.guideSourceId,
        source_site: record.sourceSite,
        source_type: record.sourceType,
        source_url: record.sourceUrl,
        source_character_id: record.sourceCharacterId ?? null,
        source_slug: record.sourceSlug ?? null,
        status: record.status,
        content_hash: record.contentHash ?? null,
        error: record.error ?? null,
        missing_fields: record.missingFields ?? [],
        metadata: record.metadata ?? {},
        imported_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    ),
    `upsert source record ${record.id}`,
  );
}

async function seedGuideSources() {
  const sources = [
    {
      id: "genshin-impact-nanoka-roster",
      game_id: GAME_ID,
      source_site: "nanoka",
      source_type: "roster",
      name: "Nanoka Genshin roster data",
      base_url: NANOKA_HOME,
      enabled: true,
      status: "pending",
      metadata: { scope: "released_characters" },
    },
    {
      id: "genshin-impact-nanoka-kit",
      game_id: GAME_ID,
      source_site: "nanoka",
      source_type: "kit",
      name: "Nanoka Genshin character kit data",
      base_url: NANOKA_HOME,
      enabled: true,
      status: "pending",
      metadata: {
        allowedFields: ["normal_attack", "elemental_skill", "elemental_burst", "passive_talents", "constellations", "rule_terms"],
      },
    },
    {
      id: "genshin-impact-icy-veins-build",
      game_id: GAME_ID,
      source_site: "icy-veins",
      source_type: "build",
      name: "Icy Veins Genshin local build guides",
      base_url: ICY_SOURCE_ROOT,
      enabled: true,
      status: "pending",
      metadata: { preserveRankings: true, sourceRoot: ICY_SOURCE_ROOT },
    },
    {
      id: "genshin-impact-icy-veins-team",
      game_id: GAME_ID,
      source_site: "icy-veins",
      source_type: "team",
      name: "Icy Veins Genshin local team guides",
      base_url: ICY_SOURCE_ROOT,
      enabled: true,
      status: "pending",
      metadata: { sourceRoot: ICY_SOURCE_ROOT, sourceRule: "local-content-files" },
    },
    {
      id: "genshin-impact-ign-team",
      game_id: GAME_ID,
      source_site: "ign",
      source_type: "team",
      name: "IGN Genshin team guides",
      base_url: "https://www.ign.com/wikis/genshin-impact/",
      enabled: false,
      status: "disabled",
      metadata: { sourceRule: "disabled_after_icy_veins_local_team_import" },
    },
  ];

  await checked(supabase.from("guide_sources").upsert(sources, { onConflict: "id" }), "seed guide sources");
}

async function updateGuideSource(id, status, error) {
  const payload = {
    status,
    last_checked_at: new Date().toISOString(),
    last_error: error,
  };
  if (!error && ["healthy", "partial"].includes(status)) payload.last_success_at = new Date().toISOString();

  await checked(supabase.from("guide_sources").update(payload).eq("id", id), `update guide source ${id}`);
}

async function startRun() {
  const { data, error } = await supabase
    .from("guide_import_runs")
    .insert({ game_id: GAME_ID, importer: "genshin-guide-importer", scope, status: "running" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function finishRun(id, status) {
  await checked(
    supabase
      .from("guide_import_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        processed_characters: report.processedCharacters,
        successful_records: report.kitsSucceeded + report.buildsSucceeded + report.teamsSucceeded,
        failed_records: report.failed.length + report.parsingFailures.length,
        errors: [...report.failed, ...report.parsingFailures],
        report,
      })
      .eq("id", id),
    "finish guide import run",
  );
}

async function checked(query, label) {
  const { error, data } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

function buildIcyContentIndex(root) {
  const byStem = new Map();
  if (!existsSync(root)) return { byStem, rootExists: false };

  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".svn") continue;
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".content") || entry.name.startsWith("template")) continue;
      const stem = basename(entry.name, ".content").toLowerCase();
      const paths = byStem.get(stem) ?? [];
      paths.push(fullPath);
      byStem.set(stem, paths);
    }
  };

  visit(root);
  return { byStem, rootExists: true };
}

function findIcyFile(character, kind) {
  if (!icyContentIndex.rootExists) return null;

  const candidates = icySlugCandidates(character).flatMap((slug) => (kind === "teams" ? [`${slug}-teams`] : [slug]));

  for (const candidate of uniqueAliases(candidates).map((item) => item.toLowerCase())) {
    const matches = icyContentIndex.byStem.get(candidate);
    if (!matches?.length) continue;
    const exactDirectoryMatch = matches.find((filePath) => {
      const parts = filePath.split(/[/\\]/);
      return basename(filePath, ".content").toLowerCase() === (parts.at(-2) ?? "").toLowerCase();
    });
    return exactDirectoryMatch ?? matches[0];
  }

  return null;
}

function icySlug(name, fallbackSlug, character = null) {
  return icySlugCandidates({ ...character, source_name: name, slug: fallbackSlug })[0] ?? fallbackSlug;
}

function icySlugCandidates(character) {
  const names = [
    character.slug,
    character.source_name,
    character.name,
    character.display_name,
    character.metadata?.baseName,
  ].filter(Boolean);
  const candidates = names.map(slugify);
  const baseName = character.metadata?.baseName ?? character.source_name ?? character.name;
  if (normalizeAlias(baseName) === "traveler" && character.element) candidates.unshift(`${slugify(character.element)}-traveler`);
  return uniqueAliases(candidates);
}

function buildAssetIndex(kind) {
  const root = join(process.cwd(), "public", "assets", "characters", GAME_ID, kind);
  const byStem = new Map();
  if (!existsSync(root)) return { root, byStem };
  const pathsByStem = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    if (![".webp", ".png", ".jpg", ".jpeg", ".svg"].includes(ext)) continue;
    const stem = basename(entry.name, ext).toLowerCase();
    const webPath = `/assets/characters/${GAME_ID}/${kind}/${entry.name}`;
    byStem.set(stem, webPath);
    pathsByStem.push({ stem, webPath });
  }

  if (kind === "characters") {
    const suffixBuckets = new Map();
    for (const item of pathsByStem) {
      const suffix = item.stem.split("-").at(-1);
      if (!suffix || suffix === item.stem) continue;
      const bucket = suffixBuckets.get(suffix) ?? [];
      bucket.push(item.webPath);
      suffixBuckets.set(suffix, bucket);
    }
    for (const [suffix, paths] of suffixBuckets.entries()) {
      if (paths.length === 1 && !byStem.has(suffix)) byStem.set(suffix, paths[0]);
    }
  }
  return { root, byStem };
}

function resolveAsset(kind, candidates) {
  const index = assetIndexes[kind];
  const normalizedCandidates = uniqueAliases(candidates.filter(Boolean).flatMap((candidate) => assetSlugCandidates(candidate)));
  for (const candidate of normalizedCandidates) {
    const path = index.byStem.get(candidate.toLowerCase());
    if (path) return { path, candidates: normalizedCandidates };
  }
  return { path: null, candidates: normalizedCandidates };
}

function characterAssetCandidates(character) {
  const candidates = [character.slug, character.displayName, character.name, character.baseName, character.metadata?.baseName].filter(Boolean);
  if (normalizeAlias(character.baseName ?? character.metadata?.baseName) === "traveler" && character.element) {
    candidates.push(`${character.element} Traveler`, `Traveler ${character.element}`);
  }
  return candidates;
}

function characterNameCandidates(name) {
  const candidates = [name];
  const normalized = normalizeAlias(name);
  if (normalized.endsWith(" traveler")) {
    const element = normalized.split(" ")[0];
    candidates.push(`${element}-traveler`, `traveler-${element}`);
  }
  return candidates;
}

function assetSlugCandidates(value) {
  const raw = String(value ?? "");
  const withoutExt = raw.replace(/\.(webp|png|jpg|jpeg|svg)$/i, "");
  const fileName = basename(withoutExt).replace(/^IMG_GENSHIN[:/\\]/, "");
  const slug = slugify(fileName);
  const candidates = [slug];
  if (slug.startsWith("icons-weapons-")) candidates.push(slug.replace("icons-weapons-", ""));
  if (slug.startsWith("portraits-artifacts-")) candidates.push(slug.replace("portraits-artifacts-", ""));
  if (slug.includes("-traveler")) {
    const [element] = slug.split("-traveler");
    if (element) candidates.push(`traveler-${element}`);
  }
  if (slug.startsWith("traveler-")) {
    const element = slug.replace("traveler-", "");
    if (element) candidates.push(`${element}-traveler`);
  }
  return candidates;
}

function withAssetPaths(items, kind) {
  return items.map((item) => {
    const asset = resolveAsset(kind, [item.sourceRef, item.name]);
    if (!asset.path) addUnresolvedAsset(kind, item.name, asset.candidates);
    return {
      ...item,
      assetPath: asset.path,
      assetMissing: !asset.path,
      assetCandidates: asset.candidates,
    };
  });
}

function addUnresolvedAsset(kind, label, candidates) {
  const list = report.unresolvedAssets[kind];
  const key = normalizeAlias(`${label} ${candidates.join(" ")}`);
  if (list.some((item) => item.key === key)) return;
  list.push({ key, label, candidates });
}

function buildCharacterAliasMap(characters) {
  const aliasBuckets = new Map();
  for (const character of characters) {
    const values = [character.name, character.display_name, character.source_name, character.slug, slugToTitle(character.slug)].filter(Boolean);
    const words = normalizeAlias(character.display_name).split(" ");
    if (words.length > 1) values.push(words.at(-1));

    for (const value of values) {
      const normalized = normalizeAlias(value);
      if (!normalized) continue;
      const bucket = aliasBuckets.get(normalized) ?? [];
      bucket.push(character);
      aliasBuckets.set(normalized, bucket);
    }
  }

  const map = new Map();
  for (const [alias, bucket] of aliasBuckets.entries()) {
    const uniqueIds = new Set(bucket.map((character) => character.id));
    if (uniqueIds.size === 1) map.set(alias, bucket[0]);
  }
  return map;
}

function cleanRichText(value) {
  if (!value) return "";
  return cleanText(
    normalizeLayoutHints(value)
      .replace(/<color=[^>]+>/g, "")
      .replace(/<\/color>/g, "")
      .replace(/<i>/g, "")
      .replace(/<\/i>/g, ""),
  ).replace(/^#(?=\S)/gm, "");
}

function normalizeLayoutHints(value) {
  return String(value ?? "").replace(/(?:\{LAYOUT_(?:MOBILE|PC|PS)#[^}]*\})+/g, (tokenGroup) => {
    const hints = [...tokenGroup.matchAll(/\{LAYOUT_(MOBILE|PC|PS)#([^}]*)\}/g)].map((match) => ({
      platform: match[1],
      text: match[2].trim(),
    }));
    return hints.find((hint) => hint.platform === "PC")?.text ?? hints[0]?.text ?? "";
  });
}

function cleanIcyText(value) {
  const expanded = String(value ?? "")
    .replace(/@@@DropdownStart:[\s\S]*?@@@DropdownEnd@@@/g, " ")
    .replace(/@@@SmallStatBlock(Start|End)@@@/g, "\n")
    .replace(/@@@Section:[^@]+@@@/g, "\n")
    .replace(/@@@TeamComposition:\s*([^@]+?)@@@/g, "$1")
    .replace(/@@@DropdownStart:\s*([^@]*?)@@@/g, (_, body) => cleanDropdownStart(body))
    .replace(/@@@([A-Za-z0-9:_/., %' -]+?)@@@/g, (_, body) => macroToText(body));
  return cleanText(expanded);
}

function cleanDropdownStart(body) {
  const imageMatch = body.match(/IMG_GENSHIN:([^,\s]+)/);
  const macroMatch = body.match(/,\s*(Genshin[A-Za-z0-9]+|[^,]+?)\s*,/);
  return macroMatch?.[1] ? macroToText(macroMatch[1]) : slugToTitle(basename(imageMatch?.[1] ?? "", extname(imageMatch?.[1] ?? "")));
}

function cleanText(value) {
  return parse(`<div>${value ?? ""}</div>`)
    .structuredText.replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function macroToText(value) {
  const body = String(value ?? "").trim();
  if (!body) return "";
  if (body.startsWith("IMG_GENSHIN:")) return slugToTitle(basename(body.slice("IMG_GENSHIN:".length), extname(body)));
  if (body.startsWith("PathGenshin")) return "";
  if (body.includes(":")) return cleanIcyText(body.split(":").slice(1).join(":"));

  let name = body
    .replace(/^LinkGenshin/, "")
    .replace(/^Genshin/, "")
    .replace(/PortraitWithLink$/, "")
    .replace(/Portrait$/, "")
    .replace(/WithIcon$/, "")
    .replace(/WithLink$/, "")
    .replace(/Description$/, "")
    .replace(/^Icon/, "");

  if (!name) return "";
  name = expandIcyConnectorWords(name);
  name = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\bDMG\b/g, "DMG")
    .trim();
  return name;
}

function expandIcyConnectorWords(value) {
  return String(value)
    .replace(/ofthe(?=[A-Z]|$)/g, "OfThe")
    .replace(/tothe(?=[A-Z]|$)/g, "ToThe")
    .replace(/forthe(?=[A-Z]|$)/g, "ForThe")
    .replace(/andthe(?=[A-Z]|$)/g, "AndThe")
    .replace(/(?<=[A-Za-z])of(?=[A-Z])/g, "Of")
    .replace(/(?<=[A-Za-z])for(?=[A-Z])/g, "For");
}

function normalizeAlias(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalizeAlias(value).replace(/\s+/g, "-");
}

function slugToTitle(value) {
  return String(value ?? "")
    .replace(/\.(webp|png|jpg|jpeg|svg)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function splitMacroList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => cleanIcyText(item))
    .filter(Boolean);
}

function rarityFromRank(rank) {
  if (rank === "QUALITY_ORANGE") return 5;
  if (rank === "QUALITY_PURPLE") return 4;
  return null;
}

function weaponTypeFromNanoka(value) {
  const map = {
    WEAPON_SWORD_ONE_HAND: "Sword",
    WEAPON_CLAYMORE: "Claymore",
    WEAPON_POLE: "Polearm",
    WEAPON_CATALYST: "Catalyst",
    WEAPON_BOW: "Bow",
  };
  return map[value] ?? value ?? null;
}

function parseNanokaDate(value) {
  if (!value) return null;
  return value.slice(0, 10);
}

function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function uniqueAliases(values) {
  const aliases = new Map();
  for (const value of values) {
    const normalized = normalizeAlias(value);
    if (normalized && !aliases.has(normalized)) aliases.set(normalized, value);
  }
  return [...aliases.values()];
}

function compactReport() {
  for (const kind of Object.keys(report.unresolvedAssets)) {
    report.unresolvedAssets[kind] = report.unresolvedAssets[kind].map(({ label, candidates }) => ({ label, candidates }));
  }
}

async function runLimited(items, limit, worker) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index, items.length);
    }
  });
  await Promise.all(workers);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printReport() {
  console.log(JSON.stringify(report, null, 2));
}
