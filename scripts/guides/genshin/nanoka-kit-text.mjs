import { parse } from "node-html-parser";

/**
 * Public kit descriptions must not expose Nanoka control markup.
 * rawDescription may keep source macros for audit; only cleaned description is user-facing.
 */
export function normalizeLayoutHints(value) {
  return String(value ?? "").replace(/(?:\{LAYOUT_(?:MOBILE|PC|PS)#[^}]*\})+/g, (tokenGroup) => {
    const hints = [...tokenGroup.matchAll(/\{LAYOUT_(MOBILE|PC|PS)#([^}]*)\}/g)].map((match) => ({
      platform: match[1],
      text: match[2].trim(),
    }));
    return hints.find((hint) => hint.platform === "PC")?.text ?? hints[0]?.text ?? "";
  });
}

export function cleanKitDescription(value) {
  if (!value) return "";

  let text = normalizeLayoutHints(String(value));

  // {LINK#S11122}Low-Temperature Cooking{/LINK} → Low-Temperature Cooking
  text = text.replace(/\{LINK#[^}]+\}([\s\S]*?)\{\/LINK\}/g, "$1");
  text = text.replace(/\{LINK#[^}]+\}/g, "");
  text = text.replace(/\{\/LINK\}/g, "");

  text = text.replace(/\{TIMEZONE\}/g, "");

  // Remaining Nanoka control macros, e.g. {FOO} or {FOO#bar}
  text = text.replace(/\{[A-Z][A-Z0-9_]*(?:#[^}]*)?\}/g, "");
  text = text.replace(/\{\/[A-Z][A-Z0-9_]*\}/g, "");

  text = text
    .replace(/<color=[^>]+>/g, "")
    .replace(/<\/color>/g, "")
    .replace(/<\/?i>/g, "");

  // HTML whitespace collapsing would destroy newlines, so decode after plain-text extract.
  text = htmlToPlainText(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^#(?=\S)/gm, "")
    .trim();

  return text;
}

function htmlToPlainText(value) {
  return parse(`<div>${value ?? ""}</div>`).structuredText.replace(/\u00a0/g, " ");
}

export function cleanKitEntryDescriptions(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
  const source =
    typeof entry.rawDescription === "string" && entry.rawDescription.length
      ? entry.rawDescription
      : (entry.description ?? "");
  return {
    ...entry,
    description: cleanKitDescription(source),
  };
}

export function cleanCharacterKitPublicFields(kit) {
  const next = { ...kit };
  for (const key of ["normal_attack", "elemental_skill", "elemental_burst"]) {
    if (next[key]) next[key] = cleanKitEntryDescriptions(next[key]);
  }
  for (const key of ["passive_talents", "constellations"]) {
    if (Array.isArray(next[key])) next[key] = next[key].map((entry) => cleanKitEntryDescriptions(entry));
  }
  if (Array.isArray(next.rule_terms)) {
    next.rule_terms = next.rule_terms.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      if (typeof entry.term !== "string") return entry;
      return { ...entry, term: cleanKitDescription(entry.term) };
    });
  }
  return next;
}
