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
  constraint game_sources_type_check check (source_type in ('rss', 'website', 'steam')),
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
alter table public.game_sources enable row level security;
alter table public.news_items enable row level security;
alter table public.videos enable row level security;
alter table public.collector_runs enable row level security;

drop policy if exists "Public games are readable" on public.games;
create policy "Public games are readable"
  on public.games for select
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

grant usage on schema public to anon, authenticated;
grant select on public.games to anon, authenticated;
grant select on public.game_sources to anon, authenticated;
grant select on public.news_items to anon, authenticated;
grant select on public.videos to anon, authenticated;
grant select on public.collector_runs to anon, authenticated;

insert into public.games (id, slug, title, genre, platforms, release_date, cover_tone, description, latest_updates, roadmap)
values
  ('genshin-impact', 'genshin-impact', 'Genshin Impact', 'Action RPG', array['PC', 'PlayStation', 'Mobile'], '2020-09-28', 'from-cyan-500/35 to-indigo-500/20', 'Open-world action RPG with a massive live-service audience and steady creator coverage.', array['Official updates feed connected', 'Website source registered'], array['Track official posts', 'Add YouTube later']),
  ('wuthering-waves', 'wuthering-waves', 'Wuthering Waves', 'Action RPG', array['PC', 'PlayStation', 'Mobile'], '2024-05-23', 'from-slate-400/30 to-cyan-500/20', 'Fast-combat open-world RPG with a creator-heavy launch curve and strong community discussion.', array['Official updates feed connected', 'Website source registered'], array['Track official posts', 'Add YouTube later']),
  ('zenless-zone-zero', 'zenless-zone-zero', 'Zenless Zone Zero', 'Action RPG', array['PC', 'PlayStation', 'Mobile'], '2024-07-04', 'from-yellow-500/35 to-zinc-500/20', 'Urban fantasy action RPG with frequent HoYoverse updates and creator-friendly events.', array['Official updates feed connected', 'Website source registered'], array['Track official posts', 'Add YouTube later']),
  ('honkai-star-rail', 'honkai-star-rail', 'Honkai Star Rail', 'Turn-based RPG', array['PC', 'PlayStation', 'Mobile'], '2023-04-26', 'from-violet-500/35 to-blue-500/20', 'Turn-based RPG with strong update cadence, theorycrafting, and creator-friendly story beats.', array['Official updates feed connected', 'Website source registered'], array['Track official posts', 'Add YouTube later']),
  ('valorant', 'valorant', 'Valorant', 'Tactical Shooter', array['PC', 'Console'], '2020-06-02', 'from-rose-500/35 to-orange-500/20', 'Competitive shooter with dependable esports spikes and a durable streaming audience.', array['Official Riot news source registered'], array['Track official posts', 'Add esports sources later']),
  ('minecraft', 'minecraft', 'Minecraft', 'Sandbox', array['PC', 'Console', 'Mobile'], '2011-11-18', 'from-emerald-500/35 to-lime-500/20', 'Evergreen sandbox platform whose audience tends to move in waves rather than vanish.', array['Official Minecraft articles source registered'], array['Track official posts', 'Add YouTube later']),
  ('apex-legends', 'apex-legends', 'Apex Legends', 'Battle Royale', array['PC', 'PlayStation', 'Xbox', 'Switch'], '2019-02-04', 'from-red-500/35 to-orange-500/20', 'High-skill battle royale with seasonality across both ranked play and viewership.', array['Official EA source registered', 'Steam news source registered'], array['Track official posts', 'Add esports sources later']),
  ('league-of-legends', 'league-of-legends', 'League of Legends', 'MOBA', array['PC'], '2009-10-27', 'from-blue-500/35 to-indigo-500/20', 'Massive competitive ecosystem with strong regional peaks and event-driven momentum.', array['Official Riot news source registered'], array['Track official posts', 'Add esports sources later'])
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
  ('genshin-impact-official-news', 'genshin-impact', 'Genshin Impact Official News', 'website', 'https://genshin.hoyoverse.com/en/news', null, '60 min', 60, array['official']),
  ('wuthering-waves-official-news', 'wuthering-waves', 'Wuthering Waves Official News', 'website', 'https://wutheringwaves.kurogames.com/en/main/news', null, '60 min', 60, array['official']),
  ('zenless-zone-zero-official-news', 'zenless-zone-zero', 'Zenless Zone Zero Official News', 'website', 'https://zenless.hoyoverse.com/en-us/news', null, '60 min', 60, array['official']),
  ('honkai-star-rail-official-news', 'honkai-star-rail', 'Honkai Star Rail Official News', 'website', 'https://hsr.hoyoverse.com/en-us/news', null, '60 min', 60, array['official']),
  ('valorant-official-news', 'valorant', 'Valorant Official News', 'website', 'https://playvalorant.com/en-us/news/', null, '60 min', 60, array['official']),
  ('minecraft-official-articles', 'minecraft', 'Minecraft Official Articles', 'website', 'https://www.minecraft.net/en-us/articles', null, '60 min', 60, array['official']),
  ('apex-legends-official-news', 'apex-legends', 'Apex Legends Official News', 'website', 'https://www.ea.com/games/apex-legends/news', null, '60 min', 60, array['official']),
  ('apex-legends-steam-news', 'apex-legends', 'Apex Legends Steam News', 'steam', null, '1172470', '60 min', 60, array['official', 'steam']),
  ('league-of-legends-official-news', 'league-of-legends', 'League of Legends Official News', 'website', 'https://www.leagueoflegends.com/en-us/news/', null, '60 min', 60, array['official'])
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
  updated_at = now();
