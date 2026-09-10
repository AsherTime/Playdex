# Multi-game canonical equipment

## Tables

- `game_equipment`: identity, game, category/type, rarity, icon, provenance, metadata and raw JSON.
- `game_equipment_stats`: arbitrary stat keys and values with optional level/ascension context.
- `game_equipment_effects`: arbitrary effect types/keys and upgrade ranks.
- `game_equipment_sets`: game-scoped sets with a text category and source rarity array.
- `game_equipment_set_bonuses`: arbitrary piece thresholds and source effect keys.

Parent identities are unique on `(game_id, source_site, source_id)`. Names and
slugs are not global identities. Categories and types are plain text, with no
game-specific database enums. Examples include `weapon/polearm`, `light_cone`,
`w_engine`, `armor`, and `accessory`. Sets can use `artifact`, `relic`,
`drive_disc`, or any future category.

Indexes cover game/source identity, game/slug, game/category/type, game/type,
parent references and recommendation targets. Stats have a NULLS NOT DISTINCT
unique constraint on `(equipment_id, stat_key, level, ascension)`. Effects are
keyed by equipment, effect type/key and rank; bonuses by set, pieces and effect key.

All tables have RLS enabled and read-only access for public clients. The two
`import_game_equipment*` RPCs use SECURITY INVOKER and are executable only by
the service role. Parent upsert and child replacement occur in a single
transaction, with parent-row locking to serialize imports for the same identity.
A failed child insert rolls back the parent and all child changes.

## Nanoka adapter

Run `npm run guides:import:equipment` for a fresh Nanoka catalog import.
Run `node scripts/guides/genshin/import-equipment.mjs --stored` to replay the
existing canonical records' raw JSON without contacting Nanoka or checking icons.
Run `npm run guides:test:equipment` for focused parser/adapter tests.

Environment: `NEXT_PUBLIC_SUPABASE_URL` and server-only
`SUPABASE_SERVICE_ROLE_KEY`, loaded through the existing Next environment loader.
Live imports discover the version from Nanoka's homepage exactly as the existing
character-kit importer does, then use the structured weapon/artifact indexes and
English per-ID JSON on `static.nanoka.cc`. No rendered equipment HTML is parsed.

Existing local icon resolution is unchanged. A matching local icon wins; otherwise
a verified Nanoka CDN reference is used. Stored replay preserves original icon
references, source hashes, source check times, and first-import timestamps.
Updates preserve the canonical parent UUID. A later index omitting an item does
not automatically delete historical canonical data.

Every item is verified after writing: all stats, ranks and set bonuses are read
back and compared with the adapter output. A run logs failures per item, continues
other items, records a `guide_import_runs` entry, writes an audit JSON under
`reports/nanoka-equipment/`, and exits nonzero for partial failures.

## Progression semantics

Nanoka's source provides level multipliers and ascension bonuses separately.
The adapter preserves both in relational rows and retains the complete
`raw_data` and `metadata.progression`.

- Level curve rows have a numeric `level`, null `ascension`, and
  `metadata.component = level_curve`. Their value is source base times the
  source level multiplier, rounded to ten decimal places.
- Ascension bonus rows have null `level`, a numeric `ascension`, and
  `metadata.component = ascension_bonus`. Values are source additions.
- To evaluate a stat at a chosen level and phase, combine its level-curve value
  with that phase's bonus. Do not treat the curve value alone as final ascended ATK.
- All source curve entries are retained, including levels through 100 where
  supplied. These rows do not assert that a weapon can unlock every source level.
  No level cap or phase unlock schedule is invented.
- Raw percentage stats remain fractions in `value`, with percent formatting
  in `display_value` and the unit in metadata. Unknown source property keys
  can remain arbitrary text.
- Staff of Homa at source Lv90 has a base curve of 421.3745972 ATK and phase-6
  bonus 186.7, totaling 608.0745972 (displayed as 608). Its Lv1 base remains
  45.9364 and its Lv1 CRIT DMG is 0.144 (14.4%).

Upgrade terminology is source-specific metadata (`rank_terminology=refinement`
for Genshin). The database stores generic `rank`, `effect_type`,
`description`, and `parameters`; no global refinement columns exist.
Artifact bonuses map Nanoka's explicit `need[]` thresholds to `affix[]`.
One-piece effects are handled identically to two-, four-, or five-piece effects.

## Guide integration

Two new reference tables are ready for future writer integration:

- `character_build_equipment_recommendations`
- `character_build_set_recommendations`

They contain canonical foreign keys, recommendation group/rank and independent
writer explanation text. Set recommendations may specify a piece count. They
contain no copied stats or passives. Triggers reject references to equipment from
a different game than the build's character.

These bridges currently have no imported recommendations. Existing character
build JSON and writer screens still work as before; their conversion is a future
task. No character-kit tables or frontend pages were changed.

## Migration and verification

Applied migrations:

1. `20260910154714_generic_game_equipment.sql` creates the generic schema and
   migrates existing stored records, stats, effects and bonuses.
2. `20260910155531_retire_legacy_equipment_tables.sql` rechecks preservation
   and removes `game_weapons` / `game_artifact_sets` without CASCADE.
   Unexpected dependencies would block retirement.

No Nanoka re-scrape was performed during this refactor. Both former tables have
been removed after successful verification. Original UUIDs, source/version,
icons, raw JSON and import timestamps survive. Every original normalized field
also remains in `metadata.legacy_snapshot` (raw JSON is stored separately),
providing an audit/recovery record without keeping compatibility tables.

Verified counts:

| Data | Rows |
| --- | ---: |
| Genshin equipment | 260 |
| Genshin sets | 65 |
| Stat/level/ascension rows | 50,892 |
| Ranked effects | 1,198 |
| Set bonuses | 125 |

Two complete stored-data replays preserved counts, parent IDs and timestamps,
with zero failures. Database-wide old/new comparisons found zero differences in
original records, curves, ascensions, passives, effect parameters or set bonuses.
The second audit is
`reports/nanoka-equipment/39d0fc4f-9023-4ffe-966e-3f4c5b67a89e.json`.

Additional transaction-only tests verified rollback on invalid stats, identical
names/source IDs in different games/providers, new category/type/stat text,
level 120 / ascension 10, rank 99, five-piece sets and rejection of cross-game
build recommendations. Test inserts were rolled back.

Seven parser/adapter tests and the isolated database TypeScript contract check
passed. No full-site browser tests, full lint or unrelated builds were run.

The migrated catalog is Nanoka snapshot 7.0.54: 252 conventional weapons plus
eight special-mode items and 65 sets, including preview entries. It is not a
verified released-only list. Original coverage remains 291 local icons, 31
Nanoka references and three missing icons; missing facts remain null.
