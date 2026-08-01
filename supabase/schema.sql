create extension if not exists pgcrypto;

create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  title text not null,
  genre text not null,
  platforms text[] not null default '{}',
  release_date date not null,
  cover_tone text,
  description text,
  latest_updates text[] not null default '{}',
  roadmap text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games add column if not exists cover_tone text;
alter table public.games add column if not exists latest_updates text[] not null default '{}';
alter table public.games add column if not exists roadmap text[] not null default '{}';
alter table public.games add column if not exists updated_at timestamptz not null default now();

create table if not exists public.game_metrics_daily (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  metric_date date not null,
  player_count integer not null,
  player_growth numeric not null,
  twitch_viewers integer not null,
  twitch_growth numeric not null,
  youtube_hype numeric not null,
  reddit_activity numeric not null,
  news_volume numeric not null,
  release_hype numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, metric_date)
);

create table if not exists public.game_news (
  id text primary key,
  game_id text references public.games(id) on delete set null,
  title text not null,
  source text not null,
  game_tag text not null,
  summary text not null,
  category text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sources (
  id text primary key,
  game_id text references public.games(id) on delete cascade,
  name text not null,
  source_type text not null default 'website',
  url text,
  external_ref text,
  status text not null default 'Pending',
  last_collected_at timestamptz,
  last_error text,
  cadence text not null default '60 min',
  cadence_minutes integer not null default 60,
  enabled boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_sources_type_check check (source_type in ('rss', 'website', 'steam', 'trusted_site')),
  constraint game_sources_status_check check (status in ('Pending', 'Healthy', 'Delayed', 'Offline', 'Error'))
);

alter table public.game_sources add column if not exists game_id text references public.games(id) on delete cascade;
alter table public.game_sources add column if not exists source_type text not null default 'website';
alter table public.game_sources add column if not exists url text;
alter table public.game_sources add column if not exists external_ref text;
alter table public.game_sources add column if not exists last_error text;
alter table public.game_sources add column if not exists cadence_minutes integer not null default 60;
alter table public.game_sources add column if not exists enabled boolean not null default true;
alter table public.game_sources add column if not exists tags text[] not null default '{}';
alter table public.game_sources add column if not exists updated_at timestamptz not null default now();
alter table public.game_sources alter column last_collected_at drop not null;
alter table public.game_sources alter column status set default 'Pending';

create unique index if not exists game_sources_unique_source
  on public.game_sources (game_id, source_type, coalesce(url, ''), coalesce(external_ref, ''));

create table if not exists public.news_items (
  id text primary key default gen_random_uuid()::text,
  game_id text references public.games(id) on delete set null,
  title text not null,
  summary text not null default '',
  url text not null,
  image_url text,
  image_source_url text,
  image_match_type text,
  source_name text not null,
  source_type text not null,
  published_at timestamptz not null,
  collected_at timestamptz not null default now(),
  external_id text,
  content_hash text not null unique,
  tags text[] not null default '{}',
  category text not null default 'Update',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_items_game_published_idx
  on public.news_items (game_id, published_at desc);

create index if not exists news_items_published_idx
  on public.news_items (published_at desc);

create index if not exists game_news_game_id_idx
  on public.game_news (game_id);

create table if not exists public.videos (
  id text primary key default gen_random_uuid()::text,
  game_id text references public.games(id) on delete set null,
  title text not null,
  url text not null,
  thumbnail_url text,
  source_name text not null,
  source_type text not null default 'youtube',
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  external_id text,
  content_hash text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists videos_game_id_idx
  on public.videos (game_id);

create table if not exists public.collector_runs (
  id text primary key default gen_random_uuid()::text,
  collector text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_records integer not null default 0,
  message text,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint collector_runs_status_check check (status in ('completed', 'failed', 'partial'))
);

create table if not exists public.trend_scores (
  game_id text primary key references public.games(id) on delete cascade,
  score numeric not null,
  status text not null,
  worth_trying_score numeric not null,
  calculated_at timestamptz not null default now()
);

create table if not exists public.upcoming_games (
  id text primary key,
  title text not null,
  release_date date not null,
  genre text not null,
  platforms text[] not null default '{}',
  hype_score numeric not null,
  wishlist_interest numeric not null,
  trailer_url text,
  news_url text,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
alter table public.game_metrics_daily enable row level security;
alter table public.game_news enable row level security;
alter table public.game_sources enable row level security;
alter table public.news_items enable row level security;
alter table public.videos enable row level security;
alter table public.collector_runs enable row level security;
alter table public.trend_scores enable row level security;
alter table public.upcoming_games enable row level security;

drop policy if exists "Public games are readable" on public.games;
create policy "Public games are readable"
  on public.games for select
  to anon, authenticated
  using (true);

drop policy if exists "Public game metrics are readable" on public.game_metrics_daily;
create policy "Public game metrics are readable"
  on public.game_metrics_daily for select
  to anon, authenticated
  using (true);

drop policy if exists "Public legacy game news is readable" on public.game_news;
create policy "Public legacy game news is readable"
  on public.game_news for select
  to anon, authenticated
  using (true);

drop policy if exists "Public enabled sources are readable" on public.game_sources;
create policy "Public enabled sources are readable"
  on public.game_sources for select
  to anon, authenticated
  using (enabled = true);

drop policy if exists "Public news items are readable" on public.news_items;
create policy "Public news items are readable"
  on public.news_items for select
  to anon, authenticated
  using (true);

drop policy if exists "Public videos are readable" on public.videos;
create policy "Public videos are readable"
  on public.videos for select
  to anon, authenticated
  using (true);

drop policy if exists "Public collector runs are readable" on public.collector_runs;
create policy "Public collector runs are readable"
  on public.collector_runs for select
  to anon, authenticated
  using (true);

drop policy if exists "Public trend scores are readable" on public.trend_scores;
create policy "Public trend scores are readable"
  on public.trend_scores for select
  to anon, authenticated
  using (true);

drop policy if exists "Public upcoming games are readable" on public.upcoming_games;
create policy "Public upcoming games are readable"
  on public.upcoming_games for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.games to anon, authenticated;
grant select on public.game_metrics_daily to anon, authenticated;
grant select on public.game_news to anon, authenticated;
grant select on public.game_sources to anon, authenticated;
grant select on public.news_items to anon, authenticated;
grant select on public.videos to anon, authenticated;
grant select on public.collector_runs to anon, authenticated;
grant select on public.trend_scores to anon, authenticated;
grant select on public.upcoming_games to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

delete from public.news_items
where game_id is not null
  and game_id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

delete from public.videos
where game_id is not null
  and game_id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

delete from public.game_news
where game_id is not null
  and game_id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

delete from public.game_metrics_daily
where game_id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

delete from public.trend_scores
where game_id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

delete from public.game_sources
where game_id is not null
  and game_id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

delete from public.games
where id not in ('genshin-impact', 'wuthering-waves', 'valorant', 'league-of-legends', 'free-fire');

insert into public.games (id, slug, title, genre, platforms, release_date, cover_tone, description, latest_updates, roadmap)
values
  ('genshin-impact', 'genshin-impact', 'Genshin Impact', 'Action RPG', array['PC', 'PlayStation', 'Mobile'], '2020-09-28', 'from-cyan-500/35 to-indigo-500/20', 'Open-world action RPG with a massive live-service audience and steady official update cadence.', array['Genshin Feed RSS registered', 'HoYoLAB feed registered', 'Official news tracking enabled'], array['Track official posts', 'Add YouTube later', 'Keep X/Twitter disabled']),
  ('wuthering-waves', 'wuthering-waves', 'Wuthering Waves', 'Action RPG', array['PC', 'PlayStation', 'Mobile'], '2024-05-23', 'from-slate-400/30 to-cyan-500/20', 'Fast-combat open-world RPG with official site updates and Steam news available for collection.', array['Official news page registered', 'Steam news registered', 'Website collector ready'], array['Track official posts', 'Track Steam news', 'Add YouTube later']),
  ('free-fire', 'free-fire', 'Free Fire', 'Battle Royale', array['Mobile'], '2017-12-04', 'from-orange-500/35 to-amber-500/20', 'Global mobile battle royale with frequent patch notes, collaborations, and esports events.', array['Garena official news registered', 'Website collector ready', 'Patch notes tracked'], array['Track official posts', 'Add esports sources later', 'Keep X/Twitter disabled']),
  ('valorant', 'valorant', 'Valorant', 'Tactical Shooter', array['PC', 'Console'], '2020-06-02', 'from-rose-500/35 to-orange-500/20', 'Competitive shooter with dependable esports spikes and a durable official news cadence.', array['Official Riot news source registered', 'Website collector ready', 'RSS not required'], array['Track official posts', 'Add esports sources later', 'Keep X/Twitter disabled']),
  ('league-of-legends', 'league-of-legends', 'League of Legends', 'MOBA', array['PC'], '2009-10-27', 'from-blue-500/35 to-indigo-500/20', 'Massive competitive ecosystem with frequent official Riot news, patch notes, and event updates.', array['Official Riot news source registered', 'Website collector ready', 'RSS not required'], array['Track official posts', 'Add esports sources later', 'Keep X/Twitter disabled'])
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

insert into public.game_sources (id, game_id, name, source_type, url, external_ref, cadence, cadence_minutes, tags, enabled)
values
  ('genshin-impact-genshin-feed', 'genshin-impact', 'Genshin Feed RSS', 'rss', 'https://genshin-feed.com/feed/rss-en-all-articles.xml', null, '60 min', 60, array['official', 'rss', 'genshin-feed', 'backup'], false),
  ('genshin-impact-hoyolab-rss', 'genshin-impact', 'Genshin Impact HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/genshin.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab', 'backup'], false),
  ('genshin-impact-game8-news', 'genshin-impact', 'Game8 Latest News', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/296701', 'game8', '60 min', 60, array['game8', 'news', 'primary'], true),
  ('genshin-impact-game8-banners', 'genshin-impact', 'Game8 Banner Schedule', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/305012', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('genshin-impact-game8-v66', 'genshin-impact', 'Game8 Version 6.6', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/594202', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('genshin-impact-game8-v67', 'genshin-impact', 'Game8 Version 6.7', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/602045', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('wuthering-waves-game8-news', 'wuthering-waves', 'Game8 Latest News', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/452488', 'game8', '60 min', 60, array['game8', 'news', 'primary'], true),
  ('wuthering-waves-game8-banners', 'wuthering-waves', 'Game8 Convene Banners', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/453303', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('wuthering-waves-game8-v35', 'wuthering-waves', 'Game8 Version 3.5', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/605253', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('wuthering-waves-game8-v34', 'wuthering-waves', 'Game8 Version 3.4', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/599097', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('wuthering-waves-official-news', 'wuthering-waves', 'Wuthering Waves Official News', 'website', 'https://wutheringwaves.kurogames.com/en/main/news', null, '60 min', 60, array['official', 'website', 'backup'], true),
  ('wuthering-waves-steam-news', 'wuthering-waves', 'Wuthering Waves Steam News', 'steam', null, '3513350', '60 min', 60, array['official', 'steam', 'backup'], true),
  ('free-fire-official-news', 'free-fire', 'Free Fire Official News', 'website', 'https://ff.garena.com/en/news/', null, '60 min', 60, array['official', 'website'], true),
  ('valorant-official-news', 'valorant', 'Valorant Official News', 'website', 'https://playvalorant.com/en-us/news/', null, '60 min', 60, array['official', 'website'], true),
  ('league-of-legends-official-news', 'league-of-legends', 'League of Legends Official News', 'website', 'https://www.leagueoflegends.com/en-us/news/', null, '60 min', 60, array['official', 'website'], true)
on conflict (id) do update set
  game_id = excluded.game_id,
  name = excluded.name,
  source_type = excluded.source_type,
  url = excluded.url,
  external_ref = excluded.external_ref,
  cadence = excluded.cadence,
  cadence_minutes = excluded.cadence_minutes,
  tags = excluded.tags,
  enabled = excluded.enabled,
  updated_at = now();

delete from public.game_sources
where id not in (
  'genshin-impact-genshin-feed',
  'genshin-impact-hoyolab-rss',
  'genshin-impact-game8-news',
  'genshin-impact-game8-banners',
  'genshin-impact-game8-v66',
  'genshin-impact-game8-v67',
  'wuthering-waves-game8-news',
  'wuthering-waves-game8-banners',
  'wuthering-waves-game8-v35',
  'wuthering-waves-game8-v34',
  'wuthering-waves-official-news',
  'wuthering-waves-steam-news',
  'free-fire-official-news',
  'valorant-official-news',
  'league-of-legends-official-news'
);
