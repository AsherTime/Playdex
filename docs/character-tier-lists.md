# Character Tier Lists

Public page: `/games/genshin-impact/tier-list`

Admin editor: `/admin/tier-lists/genshin-impact` (also linked from `/admin`).

## Initial reference

The live Game8 Main Tier List was fetched during implementation on September 11,
2026 (Asia/Kolkata). The page identifies Version 7.0 and has a `dateModified` value
of `2026-08-31T21:15:04-04:00`.

Source: https://game8.co/games/Genshin-Impact/archives/297465

154 placements map to 125 existing canonical characters. No unmatched names or
missing local icons. Main DPS, Sub-DPS, and Support remain separate. SSS starts
empty. A+ was retained with the owner's approval, preserving the live source's
SS, S, A+, A, B, C, D placements and order.

Only rankings and source metadata are stored. No source prose or source images
are copied. The snapshot and canonical name mapping are in
`reports/tier-lists/genshin-game8-seed.json`. Raiden maps to Raiden Shogun;
abbreviated family names resolve only when a whole-word suffix is unique.

## Schema and access

Migration: `supabase/migrations/20260910194716_character_tier_lists.sql`

- `game_character_tier_lists`: game FK, name, slug, version, reference URL/date,
  ordered configurable tier/role arrays, seed/edit timestamps, revision number.
- `game_character_tier_entries`: list FK, canonical character FK, role, tier,
  order, optional notes. One placement per list/character/role.
- A validation trigger enforces matching games and configured tier/role keys.
- Both tables have RLS and public read-only grants.
- `save_character_tier_list` is service-role only. The server action first checks
  the authenticated user's protected `profiles.app_role` through `requireAdmin`.
- Saves lock the parent list and atomically replace entries. A revision mismatch
  rejects a stale edit; duplicate character/role entries reject the transaction.

Future games can reuse these tables and the editor. The current public route is
enabled for Genshin only. No database tier/role enums are used.

## Seed and editing

Run `node scripts/tier-lists/seed-genshin.mjs` to extract and validate the live
rankings without inserting. Add `--apply` to initialize a missing main list.
Uses existing `.env.local` Supabase URL and server service-role key.

The seed refuses unmatched names or unexpected source table structure. An
existing main list is never overwritten, including an intentionally empty one.
There is no scheduled refresh.

Admin controls allow tier/role changes, position changes, and adding/removing a
character from a role. Save changes publishes the edit. Duplicate roles are
prevented; a character can still occupy multiple different roles.

## Verification

- Verified all 154 database entries against the live extracted placements/order.
- Verified all canonical IDs and all local icons resolve.
- Repeated seed preserves the existing list.
- TypeScript check passes.
- Both tabs navigate and Aino links to her canonical character guide.
- Mobile viewport check: 390px viewport, 375px content width/scroll width.
- Database transaction verified move/save/restore, stale revision rejection,
  duplicate rejection, and denied visitor/user write privileges.
- In the real admin browser session, moved Aino from A to SSS, saved and verified
  the public page, then restored A / Sub-DPS / position 5. All 154 entries again
  match the original source snapshot exactly after the test.

## Files

- `scripts/tier-lists/game8.mjs`
- `scripts/tier-lists/seed-genshin.mjs`
- `reports/tier-lists/genshin-game8-seed.json`
- `supabase/migrations/20260910194716_character_tier_lists.sql`
- `src/lib/tier-lists/types.ts`
- `src/lib/tier-lists/server.ts`
- `src/types/database.ts`
- `src/components/guides/GenshinNavigation.tsx`
- `src/components/guides/GenshinGuidePage.tsx`
- `src/components/tier-lists/CharacterTierList.tsx`
- `src/components/tier-lists/TierListEditor.tsx`
- `src/app/games/[slug]/tier-list/page.tsx`
- `src/app/admin/tier-lists/[gameId]/page.tsx`
- `src/app/admin/tier-lists/[gameId]/actions.ts`
- `src/app/admin/page.tsx`
- This document.
