import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/[1-5]stars?$/, "");
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function score(query, candidate) {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.85;
  const dist = levenshtein(q, c);
  const maxLen = Math.max(q.length, c.length);
  const sim = 1 - dist / maxLen;
  const qt = String(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const ct = String(candidate)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const inter = qt.filter((token) => ct.includes(token)).length;
  const token = inter / Math.max(qt.length, ct.length, 1);
  return Math.max(sim, token * 0.8);
}

function failureReason(name, sourceRef, catalog) {
  const reasons = [];
  if (sourceRef) {
    const byId = catalog.find((item) => item.source_id === sourceRef);
    if (!byId) reasons.push(`sourceRef present but no canonical source_id match (${sourceRef})`);
  } else {
    reasons.push("no usable source ID on recommendation");
  }

  const exact = catalog.find((item) => normalize(item.name) === normalize(name));
  if (!exact) reasons.push(`normalized name has no exact canonical match (${normalize(name)})`);
  if (/[1-5]\s*stars?/i.test(name) || /\dstars?/i.test(name)) {
    reasons.push("name includes rarity/star suffix noise");
  }
  if (/4pc|2pc|\(\d\)|x\d/i.test(name)) {
    reasons.push("name looks like set-piece/count annotation rather than pure item name");
  }
  return reasons.join("; ");
}

function isMatched(name, sourceRef, catalog) {
  if (sourceRef && catalog.some((item) => item.source_id === sourceRef)) return true;
  return catalog.some((item) => normalize(item.name) === normalize(name));
}

function closest(name, catalog) {
  return [...catalog]
    .map((item) => ({
      id: item.id,
      name: item.name,
      source_id: item.source_id,
      score: Number(score(name, item.name).toFixed(3)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter((item) => item.score >= 0.35);
}

function uniqueByName(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.normalized_name}||${row.recommendation_name}`;
    const existing = map.get(key) || { ...row, occurrences: [] };
    existing.occurrences.push({
      character_slug: row.character_slug,
      character_name: row.character_name,
      build_id: row.build_id,
      build_source: row.build_source,
      recommendation_group: row.recommendation_group,
      rank: row.rank,
    });
    map.set(key, existing);
  }

  return [...map.values()]
    .map((row) => {
      const {
        character_slug,
        character_name,
        build_id,
        build_source,
        recommendation_group,
        rank,
        ...rest
      } = row;
      void character_slug;
      void character_name;
      void build_id;
      void build_source;
      void recommendation_group;
      void rank;
      return rest;
    })
    .sort((a, b) => a.recommendation_name.localeCompare(b.recommendation_name));
}

const { data: builds, error: buildsError } = await supabase
  .from("character_builds")
  .select(
    "id, source_site, character_id, best_weapons, alternative_weapons, f2p_weapons, best_artifacts, alternative_artifacts",
  );
if (buildsError) throw buildsError;

const { data: characters } = await supabase
  .from("game_characters")
  .select("id, slug, display_name")
  .eq("game_id", "genshin-impact");
const characterMap = new Map((characters || []).map((character) => [character.id, character]));

const { data: weapons } = await supabase
  .from("game_equipment")
  .select("id, name, source_id, source_site, equipment_type, rarity")
  .eq("game_id", "genshin-impact")
  .eq("equipment_category", "weapon");

const { data: sets } = await supabase
  .from("game_equipment_sets")
  .select("id, name, source_id, source_site, set_category, rarities")
  .eq("game_id", "genshin-impact");

const unmatchedWeapons = [];
const unmatchedSets = [];

for (const build of builds || []) {
  const character = characterMap.get(build.character_id);
  const weaponGroups = [
    ["best_weapon", build.best_weapons],
    ["alternative_weapon", build.alternative_weapons],
    ["f2p_weapon", build.f2p_weapons],
  ];

  for (const [group, items] of weaponGroups) {
    for (const [index, item] of (items || []).entries()) {
      const name = item?.name?.trim();
      if (!name) continue;
      const sourceRef = item?.sourceRef || null;
      if (isMatched(name, sourceRef, weapons || [])) continue;
      unmatchedWeapons.push({
        kind: "weapon",
        recommendation_name: name,
        normalized_name: normalize(name),
        source_ref: sourceRef,
        character_slug: character?.slug || null,
        character_name: character?.display_name || null,
        build_id: build.id,
        build_source: build.source_site,
        recommendation_group: group,
        rank: item?.rank ?? index + 1,
        failure_reason: failureReason(name, sourceRef, weapons || []),
        closest_matches: closest(name, weapons || []),
      });
    }
  }

  const setGroups = [
    ["best_artifact", build.best_artifacts],
    ["alternative_artifact", build.alternative_artifacts],
  ];

  for (const [group, items] of setGroups) {
    for (const [index, item] of (items || []).entries()) {
      const name = item?.name?.trim();
      if (!name) continue;
      const sourceRef = item?.sourceRef || null;
      if (isMatched(name, sourceRef, sets || [])) continue;
      unmatchedSets.push({
        kind: "artifact_set",
        recommendation_name: name,
        normalized_name: normalize(name),
        source_ref: sourceRef,
        character_slug: character?.slug || null,
        character_name: character?.display_name || null,
        build_id: build.id,
        build_source: build.source_site,
        recommendation_group: group,
        rank: item?.rank ?? index + 1,
        failure_reason: failureReason(name, sourceRef, sets || []),
        closest_matches: closest(name, sets || []),
      });
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  matching_rules_current: [
    "source_id == recommendation.sourceRef when present",
    "exact normalized name match (lowercase, strip non-alphanumeric, strip trailing 1-5 stars)",
  ],
  summary: {
    unmatched_weapon_rows: unmatchedWeapons.length,
    unmatched_artifact_rows: unmatchedSets.length,
    distinct_unmatched_weapons: uniqueByName(unmatchedWeapons).length,
    distinct_unmatched_artifacts: uniqueByName(unmatchedSets).length,
  },
  unmatched_weapons: uniqueByName(unmatchedWeapons),
  unmatched_artifact_sets: uniqueByName(unmatchedSets),
  all_weapon_rows: unmatchedWeapons.sort(
    (a, b) =>
      String(a.character_name).localeCompare(String(b.character_name)) ||
      a.recommendation_name.localeCompare(b.recommendation_name),
  ),
  all_artifact_rows: unmatchedSets.sort(
    (a, b) =>
      String(a.character_name).localeCompare(String(b.character_name)) ||
      a.recommendation_name.localeCompare(b.recommendation_name),
  ),
};

mkdirSync("reports/equipment-unmatched", { recursive: true });
writeFileSync(
  "reports/equipment-unmatched/unmatched-recommendations.json",
  JSON.stringify(report, null, 2),
);

const lines = [
  "# Unmatched equipment recommendations",
  "",
  `Generated: ${report.generated_at}`,
  "",
  `Distinct unmatched weapons: **${report.summary.distinct_unmatched_weapons}** (rows ${report.summary.unmatched_weapon_rows})`,
  "",
  `Distinct unmatched artifact sets: **${report.summary.distinct_unmatched_artifacts}** (rows ${report.summary.unmatched_artifact_rows})`,
  "",
  "Closest matches are suggestions only. Do not auto-alias from this list.",
  "",
  "## Weapons",
  "",
];

for (const row of report.unmatched_weapons) {
  lines.push(`### ${row.recommendation_name}`);
  lines.push(`- normalized: \`${row.normalized_name}\``);
  lines.push(`- sourceRef: \`${row.source_ref || "null"}\``);
  lines.push(`- reason: ${row.failure_reason}`);
  lines.push(
    `- used by: ${row.occurrences
      .map(
        (occurrence) =>
          `${occurrence.character_name} (${occurrence.recommendation_group} #${occurrence.rank}, ${occurrence.build_source})`,
      )
      .join("; ")}`,
  );
  lines.push(
    `- closest: ${
      row.closest_matches.map((match) => `${match.name} [${match.score}]`).join(" | ") || "none"
    }`,
  );
  lines.push("");
}

lines.push("## Artifact sets", "");
for (const row of report.unmatched_artifact_sets) {
  lines.push(`### ${row.recommendation_name}`);
  lines.push(`- normalized: \`${row.normalized_name}\``);
  lines.push(`- sourceRef: \`${row.source_ref || "null"}\``);
  lines.push(`- reason: ${row.failure_reason}`);
  lines.push(
    `- used by: ${row.occurrences
      .map(
        (occurrence) =>
          `${occurrence.character_name} (${occurrence.recommendation_group} #${occurrence.rank}, ${occurrence.build_source})`,
      )
      .join("; ")}`,
  );
  lines.push(
    `- closest: ${
      row.closest_matches.map((match) => `${match.name} [${match.score}]`).join(" | ") || "none"
    }`,
  );
  lines.push("");
}

writeFileSync("reports/equipment-unmatched/unmatched-recommendations.md", lines.join("\n"));
console.log(JSON.stringify(report.summary, null, 2));
console.log("Wrote reports/equipment-unmatched/unmatched-recommendations.md");
