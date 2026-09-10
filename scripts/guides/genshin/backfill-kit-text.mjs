import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { cleanCharacterKitPublicFields } from "./nanoka-kit-text.mjs";

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

function publicBlob(kit) {
  const parts = [
    kit.normal_attack?.description,
    kit.elemental_skill?.description,
    kit.elemental_burst?.description,
    ...(Array.isArray(kit.passive_talents) ? kit.passive_talents.map((entry) => entry?.description) : []),
    ...(Array.isArray(kit.constellations) ? kit.constellations.map((entry) => entry?.description) : []),
    ...(Array.isArray(kit.rule_terms) ? kit.rule_terms.map((entry) => entry?.term) : []),
  ];
  return parts.filter(Boolean).join("\n");
}

function needsCleaning(kit) {
  const blob = publicBlob(kit);
  return (
    blob.includes("{LINK#") ||
    blob.includes("{/LINK}") ||
    blob.includes("{TIMEZONE}") ||
    blob.includes("\\n") ||
    /\{[A-Z][A-Z0-9_]*(?:#[^}]*)?\}/.test(blob)
  );
}

const { data: kits, error } = await supabase
  .from("character_kits")
  .select(
    "id, character_id, normal_attack, elemental_skill, elemental_burst, passive_talents, constellations, rule_terms",
  );
if (error) throw error;

let updated = 0;
const touched = [];

for (const kit of kits ?? []) {
  if (!needsCleaning(kit)) continue;
  const cleaned = cleanCharacterKitPublicFields(kit);
  const { error: updateError } = await supabase
    .from("character_kits")
    .update({
      normal_attack: cleaned.normal_attack,
      elemental_skill: cleaned.elemental_skill,
      elemental_burst: cleaned.elemental_burst,
      passive_talents: cleaned.passive_talents,
      constellations: cleaned.constellations,
      rule_terms: cleaned.rule_terms,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", kit.id);
  if (updateError) throw updateError;
  updated += 1;
  touched.push(kit.character_id);
}

console.log(
  JSON.stringify(
    {
      scanned: kits?.length ?? 0,
      updated,
      character_ids: touched.sort(),
    },
    null,
    2,
  ),
);
