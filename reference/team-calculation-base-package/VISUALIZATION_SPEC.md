# Visualization Spec

This describes how the current app visualizes team calculations so the same base can be rebuilt in Gamedex.

## 1. Main Team Page Layout

Current page:
- `src/pages/CreateTeam.tsx`

Layout:
- left column = create/edit form
- right column = live team chart preview

Structure:
- full-screen dark layout
- left sidebar width: about `450px`
- right side is the chart preview area

## 2. Team Chart Container

Current chart component:
- `src/components/TeamChart.tsx`

Chart shell:
- centered card
- max width around `420px`
- dark slate background
- thin border
- large soft shadows
- blurred glow circles in background
- top accent line

Main visual sections:
1. stat cards at top
2. character bar area in center
3. optional WuWa note block
4. export button below

## 3. Stat Cards

Current component:
- `src/components/StatCard.tsx`

Appearance:
- horizontally grouped cards
- thin divider between cards
- uppercase small label
- large bold value

Displayed stats:

Genshin:
- `Avg DPS`
- `Total DMG`
- `Rotation`

WuWa:
- `Total DPR`
- `Rotation`

Formatting:
- Genshin DPS uses `k`
- Genshin total damage in chart uses `M`
- WuWa DPR in chart uses `M`
- rotation uses one decimal place plus `s`

Formatting source:
- `src/utils/format.ts`

## 4. Character Bars

Current component:
- `src/components/CharacterBar.tsx`

Each member column has:
1. share percentage label at top
2. floating weapon icon over the bar
3. vertical colored bar
4. circular character portrait under the bar
5. character name
6. role label

Element color source:
- `src/types.ts`
- `getElementColors(...)`

### Genshin Bar Behavior

Game type:
- `genshin`

Bar behavior:
- bar height is based directly on the member `share` percentage
- formula:
  - `barHeightPercent = max(character.share, 2)`

Visual meaning:
- if a character has `25%`, the bar animates to `25%` height of the bar area
- there is a minimum visible height floor

Genshin sizes:
- bar width about `w-12`
- portrait size about `64x64`
- weapon icon about `48x48`
- bar area height about `200px`

### WuWa Bar Behavior

Game type:
- `wuwa`

Bar behavior:
- WuWa bars are scaled relative to the largest team member share, not directly raw percent height
- formula:
  - `scaledShare = character.share / maxShare`
  - `barHeightPercent = max(scaledShare * 100 * 0.82, 6)`

Visual meaning:
- the tallest WuWa bar becomes about `82%` of the bar area
- other bars are proportional to the tallest share
- minimum visible height floor still applies

WuWa sizes:
- bar width about `w-14`
- portrait size about `96x96`
- weapon icon about `64x64`
- bar area height about `156px`

### Weapon Icon Positioning

The weapon icon floats over the bar.

Genshin:
- positioned using the share percentage

WuWa:
- positioned from calculated bar height in pixels
- clamped so it never goes too high or too low

## 5. Icons and Images

Image resolution source:
- `src/utils/imageMatcher.ts`

Rules:
- first try auto-matched local asset
- if user uploaded a manual image, manual image overrides auto image
- if image fails, show `?`

Data fields used:
- `manualCharacterImage`
- `manualWeaponImage`

## 6. Character Labels

Under each portrait:
- primary line = character name
- secondary line = role

Role examples:
- `Main DPS`
- `Sub DPS`
- `Support`
- `Healer`
- etc.

## 7. WuWa Notes

WuWa only:
- chart can render a note block below the bars
- note appears only if `team.note` is present

Current source:
- `src/components/TeamChart.tsx`

## 8. Saved Team List

Current page:
- `src/pages/SavedTeams.tsx`

Layout:
- table view, not card view
- game switch at top:
  - `Genshin Teams`
  - `WuWa Teams`
- search box
- import/export buttons
- create team button

Columns:

Genshin:
- rank
- team name
- DPS
- total damage
- rotation
- character 1 to 4
- actions

WuWa:
- rank
- team name
- optional warning status column
- total damage (DPR)
- rotation
- character 1 to 3
- actions

WuWa warning UI:
- hidden unless warning toggle is enabled
- warning count is shown in the toggle summary

## 9. Saved Team Mini Card

Current component:
- `src/components/SavedTeamCard.tsx`

It is a compact card surface showing:
- team name
- date
- optional WuWa warning badge
- metric summary
- member names
- open / duplicate / delete actions

It is useful as an alternate mobile or card-grid design reference even if the main saved view is currently a table.

## 10. Formatting Rules

Current number formatting:
- `k`:
  - one decimal place
  - trailing `.0` removed
- `M`:
  - two decimal places
  - trailing `.00` removed

Current saved-list behavior:
- Genshin total damage in table displays in `k`
- WuWa total damage in table displays in `M`

Current chart behavior:
- chart stat cards use `M` for total damage / DPR

## 11. Export Behavior

Current export source:
- `src/components/TeamChart.tsx`

Behavior:
- captures the chart as PNG
- uses `html-to-image`
- waits for images and fonts to be ready
- export pixel ratio is set to `3`

Output:
- file name is based on team name when available

## 12. Rebuild Priority In Gamedex

If rebuilding the visual base from scratch, do it in this order:

1. stat card strip
2. team chart container
3. character portrait + label block
4. vertical bar rendering
5. floating weapon icon
6. game-specific metric display differences
7. saved-team list table
8. WuWa warning states

