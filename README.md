# Gamedex

Gamedex is a gaming intelligence platform for spotting what is trending, rising, cooling off, and worth trying across the gaming ecosystem. It is intentionally shaped like a data product rather than a social feed.

## What is included

- Homepage with trend snapshots, rising games, cooling games, upcoming releases, and news
- Ranked trending page with blended momentum metrics
- Game detail pages with mock charts/sentiment plus Supabase-backed news fallback
- Upcoming releases page
- News page
- Internal admin / data dashboard with manual collector actions
- Internal API routes for games, news, and collectors
- Supabase-ready schema and TypeScript database types

## Trend score

The core utility lives in `src/utils/trend-score.ts`.

```ts
baseScore =
  playerGrowth * 0.3 +
  twitchGrowth * 0.25 +
  youtubeHype * 0.2 +
  redditActivity * 0.15 +
  newsVolume * 0.1

trendScore = baseScore + releaseHype * 0.1
```

The additive `releaseHype` boost gives pre-release games a way to surface without distorting the base formula for already-released titles.

## Architecture

```text
src/
  app/            pages + internal API routes
  collectors/     news collectors for RSS, official website pages, and Steam news
  components/     reusable UI blocks
  data/           mock demo data
  lib/            app-facing query/service functions
  types/          domain + Supabase-oriented types
  utils/          scoring + formatting helpers
supabase/
  schema.sql      PostgreSQL schema + seed data
  migrations/     Supabase migration files
```

The frontend does **not** call Steam, Twitch, YouTube, Reddit, or news providers directly. UI code reads from internal services, and the public seam is exposed through route handlers such as:

- `/api/games/trending`
- `/api/games/upcoming`
- `/api/games/[slug]`
- `/api/games/[slug]/feed`
- `/api/news/latest`
- `/api/collectors/steam`
- `/api/collectors/twitch`
- `/api/collectors/news`
- `/api/collectors/run`

## Supabase news collectors

News and update cards now read from Supabase first and fall back to the mock data when tables are empty or unavailable.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply the database schema before running collectors:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

You can also paste `supabase/schema.sql` into the Supabase SQL editor.

Manual collector routes:

- `POST /api/collectors/news`
- `POST /api/collectors/run`

The first pass intentionally uses free/no-key sources first: registered RSS feeds, official website news pages, and Steam news. YouTube and X/Twitter are not required yet.

## Adding more APIs later

1. Add source rows to `game_sources`.
2. Add provider-specific collectors for sources that need APIs.
3. Add scheduling, retries, rate-limit handling, and secret management through environment variables.
4. Add YouTube Data API and X API only when their keys/access are available.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

- Trend metrics and social/community cards are still demo-only and intentionally deterministic.
- Charts are lightweight SVG-based components to avoid unnecessary dependencies during the mock phase.
- The project uses Next.js App Router, TypeScript, and Tailwind CSS with a dark-first UI.
