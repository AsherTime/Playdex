# WuWa Ingestion Diagnosis - 2026-09-12

No cron jobs, schedules, credentials, or API authentication were changed.
The updated collector code must be deployed before production cron executes it.
Live tests ran the same `runNewsCollector` used by the API, scoped to WuWa,
against the existing Supabase database. No articles were manually inserted.

## Exact Failure Points

- Official page: HTTP 200, empty `#app`, no server-rendered article anchors.
  The old generic anchor extractor returned zero articles and marked Healthy.
- Game8: 125 image/card candidates across four sources; all failed the storage
  threshold. 117 had no publication date and received a made-up collection-time
  fallback, with a -35 importance penalty. Text-only `a-btn` news links were
  missed, including the new 3.7 livestream article (archive 622037).
- Dedupe only worked within the current batch. Existing rows were upserted again
  and counted as insertions; old Steam posts had their collection time refreshed.
- `last_item_discovered_at` was set from candidate publication dates before
  filtering/storage, including fallback dates, and reset to NULL on empty fetches.
- Game assignment was not the failure: sources already use wuthering-waves.

## Fix

- Kuro's actual public CMS ArticleMenu.json and per-article JSON supply IDs,
  title, content/image, and source publication timestamps. Newest 30 articles
  are checked independently of pinned ordering, with bounded concurrency.
- WuWa Game8 discovers same-game links in article content (including text-only
  buttons), then reads article JSON-LD headline, description, image and
  datePublished. dateModified never makes an old guide into today's news.
  The newest 40 linked archive IDs per source bound discovery work. Page fetches
  are shared within each run. Inaccessible/unparseable articles are reported.
- Existing canonical URLs are checked before enrichment; conflict-ignore upsert
  handles races without rewriting existing rows. Source health requires parsed,
  persisted articles, not merely an HTTP response. Parsing failures yield Delayed
  sources and a partial collector result. No newly stored articles means the
  discovery timestamp is left untouched.
- `collector_runs.errors.sourceTraces` records per-source discovery, parsing,
  known/filtered/inserted counts, article URLs/titles and rejection reasons.

## Live Verification

First corrected run inserted **31 unique rows: 17 Game8 + 14 official**.
One article was published today; the others were previously missed older news
and keep their actual publication dates. Kuro's latest published item was Sep 9,
so no Sep 12 official publication was invented.

Examples automatically discovered and stored:

- 3.7 Livestream Codes and Countdown | Wuthering Waves (WuWa)
  https://game8.co/games/Wuthering-Waves/archives/622037
  published_at: 2026-09-12T03:27:30Z
- Resonator Review | Astral Mapping - Mornye
  https://wutheringwaves.kurogames.com/en/main/news/detail/5437
  published_at: 2026-09-09T10:00:00Z
- Version 3.6 Featured Resonator/Weapon Convene: Phase II
  https://wutheringwaves.kurogames.com/en/main/news/detail/5431
  published_at: 2026-09-09T03:15:00Z
- Upcoming Events in Wuthering Waves Version 3.6
  https://wutheringwaves.kurogames.com/en/main/news/detail/5428
  published_at: 2026-09-08T08:00:00Z

Repeated live runs inserted zero rows. Eleven known Steam posts were skipped;
one other Steam candidate was filtered. Existing collection timestamps and
source discovery timestamps stayed unchanged on zero-insert runs. Targeted
collector TypeScript checks and parser regression tests passed. No full-site
tests, builds, or lint were run.

Game8 news/banner sources each contain four links without usable publication
metadata (573467, 616616, 610898, 606414). These are logged instead of guessed.
Their source health is Delayed; official, Steam, and version sources are Healthy.

`before.json` preserves the old Game8 trace. `after-trace.json` records the first
insertion run (its early per-source filtered counters overcount shared URLs;
the 31-row DB insertion total is correct). `verified*-trace.json` has corrected
stage counts. Full title/URL lists are in those reports.

## Run Targeted Checks

```powershell
npx tsx --test scripts/wuwa-news.test.ts
npx tsc -p reports/wuwa-news/tsconfig.json
npx tsx --env-file=.env.local scripts/test-wuwa-news.ts
```

The final command invokes the real collector twice with writes enabled. Use
`--once` for one pass. Requires the existing server Supabase environment values.
