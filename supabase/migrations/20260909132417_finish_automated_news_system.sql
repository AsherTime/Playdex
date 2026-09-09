-- Finish automated news collection: quality metadata, source health, and Supabase Cron wiring.

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table public.game_sources
  drop constraint if exists game_sources_type_check;

alter table public.game_sources
  add constraint game_sources_type_check
  check (source_type in ('rss', 'website', 'steam', 'trusted_site'));

alter table public.game_sources
  add column if not exists last_attempted_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_item_discovered_at timestamptz,
  add column if not exists disabled_reason text;

alter table public.news_items
  add column if not exists original_title text,
  add column if not exists normalized_title text,
  add column if not exists canonical_url text,
  add column if not exists publication_date_confidence text not null default 'source',
  add column if not exists image_source text,
  add column if not exists image_quality integer not null default 0,
  add column if not exists image_is_fallback boolean not null default false,
  add column if not exists importance_score integer not null default 0,
  add column if not exists quality_score integer not null default 0,
  add column if not exists duplicate_of text references public.news_items(id) on delete set null,
  add column if not exists homepage_eligible boolean not null default false,
  add column if not exists filtering_reason text;

alter table public.news_items
  drop constraint if exists news_items_publication_date_confidence_check;

alter table public.news_items
  add constraint news_items_publication_date_confidence_check
  check (publication_date_confidence in ('source', 'article', 'title', 'fallback'));

update public.news_items
set
  original_title = coalesce(original_title, title),
  normalized_title = coalesce(normalized_title, title),
  canonical_url = coalesce(canonical_url, url),
  image_source = coalesce(image_source, case when image_url is not null and image_url <> '' then 'legacy' else null end),
  image_quality = case when image_url is not null and image_url <> '' then greatest(image_quality, 60) else image_quality end,
  importance_score = case when importance_score = 0 then 45 else importance_score end,
  quality_score = case when quality_score = 0 then 60 else quality_score end,
  homepage_eligible = case
    when homepage_eligible then true
    else image_url is not null
      and image_url <> ''
      and published_at >= now() - interval '14 days'
  end
where original_title is null
  or normalized_title is null
  or canonical_url is null
  or image_source is null
  or importance_score = 0
  or quality_score = 0;

create index if not exists news_items_canonical_url_idx
  on public.news_items (canonical_url)
  where canonical_url is not null;

create index if not exists news_items_homepage_rank_idx
  on public.news_items (homepage_eligible, importance_score desc, published_at desc)
  where duplicate_of is null;

create index if not exists news_items_category_published_idx
  on public.news_items (category, published_at desc);

create index if not exists game_sources_enabled_due_idx
  on public.game_sources (enabled, last_success_at, last_collected_at);

create schema if not exists app_private;
revoke all on schema app_private from public;

create table if not exists app_private.collector_settings (
  key text primary key,
  value text not null,
  is_secret boolean not null default false,
  updated_at timestamptz not null default now()
);

revoke all on app_private.collector_settings from public, anon, authenticated;

insert into app_private.collector_settings (key, value, is_secret)
values
  ('app_url', 'https://playdex-mu.vercel.app', false),
  ('cron_secret', '', true)
on conflict (key) do nothing;

create or replace function app_private.invoke_news_collector()
returns bigint
language plpgsql
security definer
set search_path = public, app_private, extensions
as $$
declare
  site_url text;
  cron_secret text;
  request_id bigint;
begin
  select nullif(trim(value), '')
    into site_url
  from app_private.collector_settings
  where key = 'app_url';

  select nullif(trim(value), '')
    into cron_secret
  from app_private.collector_settings
  where key = 'cron_secret';

  if site_url is null then
    raise exception 'Playdex collector app_url is not configured';
  end if;

  if cron_secret is null then
    raise exception 'Playdex collector cron_secret is not configured';
  end if;

  select net.http_post(
    url := site_url || '/api/collectors/run',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json',
      'User-Agent', 'Supabase-Cron/Playdex'
    ),
    body := jsonb_build_object('source', 'supabase-cron')
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function app_private.invoke_news_collector() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('playdex-news-collector-hourly');
exception
  when others then null;
end $$;

select cron.schedule(
  'playdex-news-collector-hourly',
  '7 * * * *',
  $$select app_private.invoke_news_collector();$$
);

insert into public.games (id, slug, title, genre, platforms, release_date, cover_tone, description, latest_updates, roadmap)
values
  ('honkai-star-rail', 'honkai-star-rail', 'Honkai: Star Rail', 'Turn-based RPG', array['PC', 'PlayStation', 'Mobile'], '2023-04-26', 'from-violet-500/35 to-blue-500/20', 'Turn-based RPG with frequent HoYoverse updates, character reveals, and event news.', array['HoYoLAB feed registered'], array['Track official posts', 'Add YouTube later']),
  ('zenless-zone-zero', 'zenless-zone-zero', 'Zenless Zone Zero', 'Action RPG', array['PC', 'PlayStation', 'Mobile'], '2024-07-04', 'from-yellow-500/35 to-zinc-500/20', 'Urban fantasy action RPG with frequent HoYoverse updates and event-driven news.', array['HoYoLAB feed registered'], array['Track official posts', 'Add YouTube later'])
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  genre = excluded.genre,
  platforms = excluded.platforms,
  release_date = excluded.release_date,
  cover_tone = excluded.cover_tone,
  description = excluded.description,
  latest_updates = excluded.latest_updates,
  roadmap = excluded.roadmap,
  updated_at = now();

insert into public.game_sources (id, game_id, name, source_type, url, external_ref, cadence, cadence_minutes, tags)
values
  ('global-pc-gamer-rss', null, 'PC Gamer', 'rss', 'https://www.pcgamer.com/rss/', null, '60 min', 60, array['global', 'rss', 'trusted']),
  ('global-eurogamer-rss', null, 'Eurogamer', 'rss', 'https://www.eurogamer.net/feed', null, '60 min', 60, array['global', 'rss', 'trusted']),
  ('global-ign-games-rss', null, 'IGN Games', 'rss', 'https://feeds.ign.com/ign/games-all', null, '60 min', 60, array['global', 'rss', 'trusted']),
  ('global-vgc-rss', null, 'Video Games Chronicle', 'rss', 'https://www.videogameschronicle.com/feed/', null, '60 min', 60, array['global', 'rss', 'trusted']),
  ('global-gematsu-rss', null, 'Gematsu', 'rss', 'https://www.gematsu.com/feed', null, '120 min', 120, array['global', 'rss', 'trusted']),
  ('genshin-impact-genshin-feed', 'genshin-impact', 'Genshin Feed RSS', 'rss', 'https://genshin-feed.com/feed/rss-en-all-articles.xml', null, '60 min', 60, array['official', 'rss', 'genshin-feed']),
  ('genshin-impact-hoyolab-rss', 'genshin-impact', 'Genshin Impact HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/genshin.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab']),
  ('honkai-star-rail-hoyolab-rss', 'honkai-star-rail', 'Honkai: Star Rail HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/starrail.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab']),
  ('zenless-zone-zero-hoyolab-rss', 'zenless-zone-zero', 'Zenless Zone Zero HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/zenless.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab'])
on conflict (id) do update set
  game_id = excluded.game_id,
  name = excluded.name,
  source_type = excluded.source_type,
  url = excluded.url,
  external_ref = excluded.external_ref,
  cadence = excluded.cadence,
  cadence_minutes = excluded.cadence_minutes,
  tags = excluded.tags,
  enabled = true,
  status = 'Pending',
  last_error = null,
  consecutive_failures = 0,
  disabled_reason = null,
  updated_at = now();
