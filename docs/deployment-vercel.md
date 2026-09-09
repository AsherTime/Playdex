# Deploy Gamedex on Vercel

Gamedex is a Next.js app with Supabase-backed news collectors. **Vercel is the recommended host** for this project.

## Vercel vs Cloudflare

| | Vercel | Cloudflare Pages |
|---|--------|------------------|
| Next.js App Router | Native, first-class | Requires adapter; more setup |
| Cron for news collectors | Supabase Cron calls Vercel route; Vercel Cron can remain as fallback | Separate Worker + cron trigger |
| Long collector runs | Up to 60s (Hobby) / 300s (Pro) | Workers CPU limits (~30s free) |
| Supabase | Standard pattern | Works, but cron is extra work |
| Middleware / auth | Works as-is | May need edge compatibility checks |

**Recommendation:** use **Vercel** unless you already standardize on Cloudflare and are willing to maintain a Worker cron + longer-run workarounds.

---

## How news collection works

```text
Supabase Cron (hourly)
    → GET /api/collectors/run  (Authorization: Bearer CRON_SECRET)
        → runNewsCollector()
            → reads enabled game_sources from Supabase
            → skips sources collected within cadence_minutes
            → fetches RSS / Game8 / Riot / Steam / website sources
            → normalizes title/date/image/category/quality metadata
            → upserts into news_items
            → logs collector_runs + updates game_sources health

Homepage /news pages
    → getLatestNews() reads news_items from Supabase
    → homepage uses homepage_eligible + importance/freshness ranking
    → falls back to mock data if empty
```

Vercel Cron remains as a daily fallback through `vercel.json`, but Supabase Cron is the primary
automation path. Manual runs from `/admin` use server actions and are only for testing/emergency use.

---

## One-time setup

### 1. Supabase

Apply migrations:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Or run SQL from `supabase/migrations/` in the Supabase SQL editor.

The news automation migration creates `pg_cron`, `pg_net`, the private
`app_private.collector_settings` table, the `app_private.invoke_news_collector()` function, and
the hourly cron job `playdex-news-collector-hourly`.

After choosing the production URL and secret, set the private Supabase cron settings:

```sql
update app_private.collector_settings
set value = 'https://YOUR-DOMAIN.vercel.app', updated_at = now()
where key = 'app_url';

update app_private.collector_settings
set value = 'THE-SAME-VALUE-AS-VERCEL-CRON_SECRET', updated_at = now()
where key = 'cron_secret';
```

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
| `CRON_SECRET` | Generate a long random string; this must match `app_private.collector_settings.cron_secret` in Supabase |

5. Deploy

Vercel reads `vercel.json` and registers a daily fallback cron job:

```json
{
  "crons": [{ "path": "/api/collectors/run", "schedule": "0 0 * * *" }]
}
```

That runs at **00:00 UTC** every day. Supabase Cron runs hourly at minute 7.

### 4. Verify cron

After deploy:

1. Supabase SQL editor:

```sql
select jobid, schedule, active, command
from cron.job
where jobname = 'playdex-news-collector-hourly';
```

2. Trigger manually once:

```bash
curl -X GET "https://YOUR-DOMAIN.vercel.app/api/collectors/run" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

3. Check Supabase `collector_runs`, `game_sources.last_success_at`, and `/admin`.

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
| Cron returns 401 | `CRON_SECRET` in Vercel must match `app_private.collector_settings.cron_secret` in Supabase |
| Cron returns 503 | Set `CRON_SECRET` in Vercel env vars and the Supabase private cron setting |
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
