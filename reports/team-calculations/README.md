# Genshin Team Calculations Integration

## Result

- 75 unique calculations imported into Playdex's Supabase project.
- 300 member relationships, exactly four per calculation.
- No unmatched characters; no new canonical characters created.
- Existing written Team Guide remains separate and unchanged.
- Open a Genshin character guide, select Teams, then Team Calculations.
- Calculations are selected dynamically by canonical character membership and ordered by stored DPS descending, not recommendation rank.
- Source files were read only. WuWa and unrelated guide features were not modified.

## Export Structure and Units

Source: `D:\Team graphic genshin\outputs\team-calculations-export`.
Contains `genshin-wuwa-team-calculations.xlsx` and its `.inspect.ndjson` companion; there is no UI source in that directory.
Workbook sheets: README, Genshin Teams, Genshin Members, WuWa Teams, WuWa Members, Element Colors.
Headers are in row 4. Only the two Genshin data sheets were imported.

`source-snapshot.json` preserves every exported Genshin team/member field and the workbook SHA-256.
Team IDs are the exported saved-team UUIDs. A calculation is stored once; members refer to it by calculation ID and slot.

| Export field | Database meaning | Display |
| --- | --- | --- |
| stored_dps_k | team_dps = source x 1,000 | Divide by 1,000, suffix K |
| total_damage_m | dpr = source x 1,000,000 | Divide by 1,000,000, suffix M |
| rotation_seconds | rotation_seconds, unchanged | Seconds |
| share_pct | damage_share, percentage points | Source percentage unchanged |
| source_damage_m | damage = source x 1,000,000, nullable | Individual damage only when supplied |
| derived_damage_m | Preserved in member details, not source damage | Not presented as measured damage |

All 300 source_damage_m values are null. Do not reconstruct measured individual damage from rounded shares.
Shares are not normalized, equalized, or adjusted with residual damage. Source totals and stored DPS are not recomputed.
Original notes, source-file identifiers, calculated DPS, warnings, dates, colors and derived fields are retained in details JSON.
Notes are shown when supplied, including rotation/build assumptions. No weapon/build assumptions are invented.

## Database

New tables:
- `public.team_damage_calculations`: UUID, game ID, source identifier, name, raw DPS/DPR, rotation seconds, source details.
- `public.team_damage_calculation_members`: calculation ID + slot primary key, canonical character ID, original display name, weapon, role, element, nullable measured damage, source share, original details.

Foreign keys reference existing games and game_characters. Character membership is indexed.
Both tables have RLS and public SELECT policies; client writes are revoked. Imports require a server-only service-role key.
Normal recommendation tables were not reused or changed.

Character aliases are conservative: Bennet -> Bennett, Kuki -> Kuki Shinobu, Mizuki -> Yumemizuki Mizuki, Yae -> Yae Miko.
Constellation/refinement suffixes and harmless punctuation are removed only for lookup; original labels stay intact.
Traveler variants use the source element to match the canonical variant. Unknown/ambiguous names stop import and produce a report before writes.

## UI Reuse

Inspected Playdex's existing reference/team-calculation-base-package and game-calc components.
The new guide chart directly reuses TeamBreakdownBar: existing Genshin element colors, percentage-height bars, floating circular weapon icons, circular character portraits, names and roles.
The surrounding metric strip and dark bordered chart reuse the existing TeamBreakdownChart design.
The new screen loads real calculations, not the mock roster/calculations used by older prototype routes.
Weapon labels remain exact. Missing weapon images use the existing image fallback, not guessed weapons.
See verification.json for unresolved weapon labels. They include both aliases and unavailable assets; they are not unmatched characters.

## Verified Example

One shared calculation: `8b63ea26-6a4f-4fce-9134-4df522b1c7ea`, `mavuika premium`.
Its actual exported members are Mavuika, Citlali, Iansan, Bennett (not Xilonen).
The identical calculation was returned by public membership queries for all four guides:

- `/games/genshin-impact/characters/mavuika`
- `/games/genshin-impact/characters/citlali`
- `/games/genshin-impact/characters/iansan`
- `/games/genshin-impact/characters/bennett`

Verified all imported fields against the snapshot, four unique canonical members per team, public read access, and that Mavuika receives only teams containing Mavuika.
Quick TypeScript check passed. No full-site tests, lint or production build were run. Browser visual QA and deployment were not performed.

## Files Added or Changed

- `scripts/guides/genshin/extract-team-calculations.py`
- `scripts/guides/genshin/import-team-calculations.mjs`
- `supabase/migrations/20260911090000_team_damage_calculations.sql`
- `src/types/database.ts`
- `src/lib/guides/team-calculation-types.ts`
- `src/lib/guides/team-calculations.ts`
- `src/lib/guides/genshin.ts`
- `src/components/guides/TeamCalculations.tsx`
- `src/components/guides/GuideTabs.tsx`
- `reports/team-calculations/` (this guide, snapshot, unmatched report, verification report)

## Repeatable Import

From D:\gamedex, with openpyxl available:

```powershell
python scripts/guides/genshin/extract-team-calculations.py "D:\Team graphic genshin\outputs\team-calculations-export\genshin-wuwa-team-calculations.xlsx" reports/team-calculations/source-snapshot.json
node --env-file=.env.local scripts/guides/genshin/import-team-calculations.mjs --write
```

Omit --write to verify against existing records without writing calculations.
Upserts use stable source IDs and member slots, so reimporting does not create duplicate per-character copies.
The current import is additive/update-only: it does not delete other calculations when a later workbook omits them.
Keep service-role credentials private; they are not included in these reports.
