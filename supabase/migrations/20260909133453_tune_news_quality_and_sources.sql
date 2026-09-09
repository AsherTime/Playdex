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

insert into public.game_sources (id, game_id, name, source_type, url, external_ref, cadence, cadence_minutes, tags, enabled, status, last_error, consecutive_failures, disabled_reason)
values
  ('genshin-impact-genshin-feed', 'genshin-impact', 'Genshin Feed RSS', 'rss', 'https://genshin-feed.com/feed/rss-en-all-articles.xml', null, '60 min', 60, array['official', 'rss', 'genshin-feed'], true, 'Pending', null, 0, null),
  ('genshin-impact-hoyolab-rss', 'genshin-impact', 'Genshin Impact HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/genshin.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab'], true, 'Pending', null, 0, null),
  ('honkai-star-rail-hoyolab-rss', 'honkai-star-rail', 'Honkai: Star Rail HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/starrail.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab'], true, 'Pending', null, 0, null),
  ('zenless-zone-zero-hoyolab-rss', 'zenless-zone-zero', 'Zenless Zone Zero HoYoLAB RSS', 'rss', 'https://feeds.c3kay.de/zenless.xml', null, '60 min', 60, array['official', 'rss', 'hoyolab'], true, 'Pending', null, 0, null)
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
