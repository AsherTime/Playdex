# Gaming Identity & Public Profiles

Gamedex profiles are gaming identity pages — not generic account settings.

## Routes

- `/profile` — edit your identity, privacy, tracker, and gaming history
- `/u/[username]` — public gaming profile (no login required when public)

## Username

- Stored lowercase in `profiles.username`
- Validated in app (`src/lib/username.ts`) and DB constraint
- Reserved names blocked (admin, api, login, etc.)

## Privacy defaults

All public stat toggles default to **off**. Android tracking does not auto-publish activity. Users must:

1. Set profile visibility to **Public**
2. Enable individual toggles (playtime, games, improvement plan, etc.)

## Public profile data

Public pages use the Supabase RPC `get_public_gaming_profile(username)` which:

- Returns only fields allowed by privacy toggles
- Aggregates usage via `get_gaming_usage_aggregates` / `get_gaming_usage_totals` (no full history download)
- Never exposes email or raw device events

## Homepage dashboard

The homepage (`GamingDashboard`) prioritizes:

1. Android live tracker (when enabled)
2. Synced Supabase usage (web or after Android sync)
3. CTA states for logged-out / no tracker / no data

## Share

- **Share Profile** — Web Share API or clipboard; URL from `NEXT_PUBLIC_APP_URL` / current origin
- **Share Gaming Summary** — text summary for social apps + visual `GamingSummaryShareCard`

Set in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.vercel.app
```

## Migrations required

1. `20260813120000_user_game_usage_daily.sql` (if not applied yet)
2. `20260813140000_gaming_identity_profiles.sql`
