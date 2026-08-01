# Team Calculation Base Package

This package is meant to help rebuild the current Genshin + WuWa team calculation feature inside Gamedex.

It includes:
- the current saved team calculation data
- a normalized export of all saved teams
- a CSV summary for quick review
- source-reference files for the current implementation
- a visualization spec for recreating the team chart and saved list

## Package Structure

- `data/raw-saved-teams/`
  - direct copy of the current folder-backed team JSON files
- `data/normalized/`
  - combined normalized exports for migration work
- `source-reference/`
  - current source files that implement the team feature
- `VISUALIZATION_SPEC.md`
  - how the team chart, bars, cards, and saved list are rendered
- `TEAM_CALCULATION_SHAPE.md`
  - what the current team/member data looks like

## Current Export Snapshot

Current saved team count:
- total: `134`
- genshin: `13`
- wuwa: `121`

Important note:
- 13 older Genshin rows were missing `gameType` in their raw JSON files
- the current app treats those as Genshin by default
- the normalized exports in `data/normalized/` already convert those rows to `gameType = "genshin"`

## Browser Cache Note

I checked the current running app for leftover browser-stored team keys.

Result at export time:
- the live app page did not expose a usable `localStorage` object through the browser automation runtime
- no separate readable browser-cached team dataset was recovered that was distinct from the current folder-backed saved teams

Practical takeaway:
- the exported data in this package should be treated as the current saved team source of truth
- the older Genshin teams already appear to be present in the saved team snapshot

## Most Useful Files To Hand Someone

If someone only needs the essentials:
- `data/normalized/all-teams.normalized.json`
- `data/normalized/team-summary.csv`
- `VISUALIZATION_SPEC.md`
- `TEAM_CALCULATION_SHAPE.md`
- `source-reference/src/components/TeamChart.tsx`
- `source-reference/src/components/CharacterBar.tsx`
- `source-reference/src/components/TeamForm.tsx`
- `source-reference/src/pages/SavedTeams.tsx`
- `source-reference/src/data/defaultTeam.ts`
- `source-reference/src/data/wuwaData.ts`

