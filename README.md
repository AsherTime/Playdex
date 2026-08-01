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

News and update cards read from Supabase first and fall back to mock data when tables are empty or unavailable.

### Flow

1. **Collect** — `runNewsCollector()` fetches enabled `game_sources` (RSS, Game8, Riot, Steam, website).
2. **Store** — upserts into `news_items`; logs runs in `collector_runs`.
3. **Serve** — `/`, `/news`, and `/api/news/latest` read via `getLatestNews()`.

### Environment variables

See `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=            # required in production for scheduled runs
```

Apply the database schema before running collectors:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### Scheduling (12 hours)

Production uses **Vercel Cron** (`vercel.json`):

- `GET /api/collectors/run` every 12 hours
- Protected by `CRON_SECRET`
- Sources respect `cadence_minutes` (default **720** = 12 hours)

Manual runs: `/admin` → Run News Collector (server action, forces all sources).

Full deploy guide: [docs/deployment-vercel.md](docs/deployment-vercel.md)

The first pass uses free/no-key sources: RSS, official website pages, Game8, Riot news JSON, and Steam news.

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
