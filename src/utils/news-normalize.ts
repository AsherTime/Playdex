const CATEGORY_PREFIXES = [
  "Game Updates",
  "Patch Notes",
  "Dev Update",
  "Developer Update",
  "Community Update",
  "Community",
  "Esports",
  "Release",
  "Rumor",
  "News",
  "Update",
  "Dev",
];

const ISO_TIMESTAMP =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g;

const GLUED_HEADING =
  /\b(Notes|Patch|Update|Dev|Recap|Primer|Reveal|Launch|Trailer|Preview|Hotfix|Maintenance)(\s*)([A-Z])/g;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function cleanNewsText(value: string | undefined | null) {
  return collapseWhitespace(
    (value ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'"),
  );
}

function stripCategoryPrefixes(value: string) {
  let title = value;

  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;

    for (const prefix of CATEGORY_PREFIXES) {
      const pattern = new RegExp(`^${prefix.replace(/\s+/g, "\\s+")}(?=\\s|[A-Z0-9]|$)`, "i");
      if (pattern.test(title)) {
        title = title.replace(pattern, "").trim();
        changed = true;
      }
    }

    if (!changed) break;
  }

  return title;
}

function splitGluedSubtitle(value: string) {
  return value.replace(GLUED_HEADING, "$1: $3");
}

function normalizeAuthorSeparators(value: string) {
  return value.replace(/\s+[-–—]\s+/g, " — ");
}

function summaryFromTitle(title: string) {
  const colonParts = title.split(/:\s+/);
  if (colonParts.length > 1) {
    const excerpt = colonParts.slice(1).join(": ").trim();
    if (excerpt.length >= 12) return excerpt;
  }

  const dashParts = title.split(/\s—\s/);
  if (dashParts.length > 1) {
    const excerpt = dashParts.slice(1).join(" — ").trim();
    if (excerpt.length >= 12) return excerpt;
  }

  return title.length > 160 ? `${title.slice(0, 157).trim()}…` : title;
}

function summariesMatch(a: string, b: string) {
  const left = a.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const right = b.toLowerCase().replace(/[^\w\s]/g, "").trim();
  return !left || !right || left === right || left.startsWith(right) || right.startsWith(left);
}

export function normalizeNewsTitle(raw: string | undefined | null) {
  let title = cleanNewsText(raw);
  if (!title) return "";

  title = title.replace(ISO_TIMESTAMP, " ");
  title = stripCategoryPrefixes(title);
  title = splitGluedSubtitle(title);
  title = normalizeAuthorSeparators(title);
  title = collapseWhitespace(title);

  return title;
}

export function normalizeNewsSummary(
  raw: string | undefined | null,
  cleanTitle: string,
  rawTitle?: string | undefined | null,
) {
  const cleanedSummary = normalizeNewsTitle(raw);
  const cleanedRawTitle = normalizeNewsTitle(rawTitle ?? raw);

  if (!cleanTitle) {
    return cleanedSummary || summaryFromTitle(cleanedRawTitle);
  }

  if (
    !cleanedSummary ||
    cleanedSummary.length < 20 ||
    summariesMatch(cleanedSummary, cleanTitle) ||
    summariesMatch(cleanedSummary, cleanedRawTitle)
  ) {
    return summaryFromTitle(cleanTitle);
  }

  if (cleanedSummary.length > 320) {
    return `${cleanedSummary.slice(0, 317).trim()}…`;
  }

  return cleanedSummary;
}
