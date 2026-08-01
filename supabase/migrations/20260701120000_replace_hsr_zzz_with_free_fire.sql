-- Remove Honkai: Star Rail and Zenless Zone Zero; add Free Fire.

delete from public.news_items
where game_id in ('honkai-star-rail', 'zenless-zone-zero');

delete from public.game_sources
where game_id in ('honkai-star-rail', 'zenless-zone-zero');

delete from public.game_metrics_daily
where game_id in ('honkai-star-rail', 'zenless-zone-zero');

delete from public.trend_scores
where game_id in ('honkai-star-rail', 'zenless-zone-zero');

delete from public.games
where id in ('honkai-star-rail', 'zenless-zone-zero');

insert into public.games (id, slug, title, genre, platforms, release_date, cover_tone, description, latest_updates, roadmap)
values
  (
    'free-fire',
    'free-fire',
    'Free Fire',
    'Battle Royale',
    array['Mobile'],
    '2017-12-04',
    'from-orange-500/35 to-amber-500/20',
    'Global mobile battle royale with frequent patch notes, collaborations, and esports events.',
    array['Garena official news registered', 'Website collector ready', 'Patch notes tracked'],
    array['Track official posts', 'Add esports sources later', 'Keep X/Twitter disabled']
  )
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
  (
    'free-fire-official-news',
    'free-fire',
    'Free Fire Official News',
    'website',
    'https://ff.garena.com/en/news/',
    null,
    '60 min',
    60,
    array['official', 'website'],
    true
  )
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
