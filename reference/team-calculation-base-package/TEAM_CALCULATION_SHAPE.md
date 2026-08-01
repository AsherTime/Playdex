# Team Calculation Shape

This describes what the current saved team data actually looks like.

## Current Team Object

Source type:
- `src/types.ts`

Current shape:

```ts
interface Team {
  id: string;
  gameType: 'genshin' | 'wuwa';
  teamName: string;
  note?: string;
  dps?: number;
  totalDamage: number;
  rotation: number;
  createdAt: number;
  characters: Character[];
  unresolvedWarnings?: boolean;
  unmatchedItems?: string[];
  unmatchedCount?: number;
}
```

## Current Character Object

```ts
interface Character {
  id: string;
  name: string;
  weaponName: string;
  role: string;
  share: number;
  element: ElementType;
  manualCharacterImage: string;
  manualWeaponImage: string;
}
```

## How The Calculation Data Works

The current app is not storing a full combat simulation model.

It stores:
- one team-level DPS value for Genshin
- one team-level total damage value
- one team-level rotation duration
- one per-member share percentage

It does not store:
- exact per-member damage numbers in the saved team JSON
- detailed rotation step lists
- attack sequences
- formula trees

So the current “team calculation” model is really:
- team metrics
- member share distribution
- member identity and weapon labels

## Genshin Interpretation

Genshin uses:
- `dps`
- `totalDamage`
- `rotation`
- 4 members

Saved list ranking:
- DPS first
- total damage second

## WuWa Interpretation

WuWa uses:
- `totalDamage` as the DPR-like main damage metric
- `rotation`
- 3 members
- optional `note`
- optional unresolved import warnings

Saved list ranking:
- effectively by `totalDamage`, because `dps` is usually undefined

## Member Share

`share` is used for visualization.

Examples:
- Genshin often sums to `100`
- WuWa also aims to sum to `100`

The app shows a warning badge in the form if total share is not `100%`.

## Data Sources Included In This Package

Raw source snapshot:
- `data/raw-saved-teams/*.json`

Normalized export:
- `data/normalized/all-teams.normalized.json`
- `data/normalized/genshin-teams.normalized.json`
- `data/normalized/wuwa-teams.normalized.json`
- `data/normalized/team-summary.csv`

## Notes About Normalization

The normalized export does two helpful things:

1. It fills missing older `gameType` values as `genshin`
2. It adds display-friendly fields:
- `displayAvgDps`
- `displayTotalDamageOrDpr`

These are convenience export fields only.

