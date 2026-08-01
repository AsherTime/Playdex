# Deploy Gamedex on Vercel

Gamedex is a Next.js app with Supabase-backed news collectors. **Vercel is the recommended host** for this project.

## Vercel vs Cloudflare

| | Vercel | Cloudflare Pages |
|---|--------|------------------|
| Next.js App Router | Native, first-class | Requires adapter; more setup |
| Cron for news collectors | Built-in (`vercel.json`) | Separate Worker + cron trigger |
| Long collector runs | Up to 60s (Hobby) / 300s (Pro) | Workers CPU limits (~30s free) |
| Supabase | Standard pattern | Works, but cron is extra work |
| Middleware / auth | Works as-is | May need edge compatibility checks |

**Recommendation:** use **Vercel** unless you already standardize on Cloudflare and are willing to maintain a Worker cron + longer-run workarounds.

---

## How news collection works

```text
Vercel Cron (every 12h)
    → GET /api/collectors/run  (Authorization: Bearer CRON_SECRET)
        → runNewsCollector()
            → reads enabled game_sources from Supabase
            → skips sources collected within cadence_minutes (720 = 12h)
            → fetches RSS / Game8 / Riot / Steam / website sources
            → upserts into news_items
            → logs collector_runs + updates game_sources health

Homepage /news pages
    → getLatestNews() reads news_items from Supabase
    → falls back to mock data if empty
```

Manual runs from `/admin` use server actions (no public API key needed).

---

## One-time setup

### 1. Supabase

Apply migrations (includes auth + 12-hour cadence):

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Or run SQL from `supabase/migrations/` in the Supabase SQL editor.

### 2. Push to GitHub

Repo: `https://github.com/Playdex-tracker/playdex-main`

### 3. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Playdex-tracker/playdex-main`
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables (copy from `.env.example`):

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server only — never expose to client) |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` or any long random string |

5. Deploy

Vercel reads `vercel.json` and registers a cron job:

```json
{
  "crons": [{ "path": "/api/collectors/run", "schedule": "0 */12 * * *" }]
}
```

That runs at **00:00 and 12:00 UTC** every day.

### 4. Verify cron

After deploy:

1. Vercel → Project → **Settings → Cron Jobs** — confirm `/api/collectors/run` is listed
2. Trigger manually once:

```bash
curl -X GET "https://YOUR-DOMAIN.vercel.app/api/collectors/run" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

3. Check Supabase `collector_runs` and `game_sources.last_collected_at`

---

## Local development

Copy env vars:

```bash
cp .env.example .env.local
# fill in Supabase keys; CRON_SECRET optional locally
```

Run collector manually:

- Open `/admin` → **Run News Collector**, or
- `POST /api/collectors/news` works without auth when `CRON_SECRET` is unset in dev

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cron returns 401 | `CRON_SECRET` in Vercel must match; Vercel auto-sends it on cron invocations |
| Cron returns 503 | Set `CRON_SECRET` in Vercel env vars |
| Collector times out | Upgrade to Vercel Pro for 300s `maxDuration`, or reduce enabled sources |
| Game8 sources fail on Vercel | Node `fetch` only (curl disabled in serverless); check source URL reachability |
| News empty on site | Run collector once; confirm Supabase env vars on Vercel |

---

## Optional: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel --prod
```

You manage the Vercel project; the agent cannot log into your Vercel account on your behalf.
