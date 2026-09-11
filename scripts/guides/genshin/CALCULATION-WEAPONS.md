# Calculation weapon identities

Apply the `calculation_weapon_identity` migration before using the updated importer.
`team_damage_calculation_members.equipment_id` references `game_equipment.id`.
The original `weapon_name` and source `details` remain unchanged. The guide loader
uses the referenced equipment's name and icon when an ID exists.

Both import and backfill use `resolve-calculation-weapon.mjs`. Matching is scoped
to Genshin weapons and applies the character's canonical weapon type. Exact
names take priority, followed by canonical slugs/metadata aliases, unique token
prefixes (at least three letters), then conservative token edit-distance matching.
Fuzzy matching requires a known weapon type, minimum score 0.88, and a 0.10 lead
over the runner-up. Ambiguous or incompatible matches stay unresolved.

Run from the project root:

```powershell
node --test scripts/guides/genshin/resolve-calculation-weapon.test.mjs
node --env-file=.env.local scripts/guides/genshin/backfill-calculation-weapons.mjs
node --env-file=.env.local scripts/guides/genshin/backfill-calculation-weapons.mjs --write
```

Backfill changes only `equipment_id`, checks all other member/team fields against
the before snapshot, and verifies the resulting IDs. Repeating it skips unchanged
rows. The workbook hash must match the existing parsed source snapshot; a changed
workbook requires running the existing extraction script first.

The future importer (`import-team-calculations.mjs --write`) also resolves IDs.
Without `--write`, it verifies the expected import against the saved data.

Reports are in `reports/team-calculations/weapon-resolution.json` (backfill counts,
individual matches, unresolved names with characters/teams/candidates/reasons) and
`import-weapon-resolution.json` (future import resolutions).
