alter table public.game_sources drop constraint if exists game_sources_type_check;
alter table public.game_sources add constraint game_sources_type_check
  check (source_type in ('rss', 'website', 'steam', 'trusted_site'));

alter table public.news_items add column if not exists image_source_url text;
alter table public.news_items add column if not exists image_match_type text;

update public.game_sources
set enabled = false, updated_at = now()
where id in (
  'genshin-impact-genshin-feed',
  'genshin-impact-hoyolab-rss',
  'honkai-star-rail-hoyolab-rss',
  'zenless-zone-zero-hoyolab-rss'
);

insert into public.game_sources (id, game_id, name, source_type, url, external_ref, cadence, cadence_minutes, tags, enabled)
values
  ('genshin-impact-game8-news', 'genshin-impact', 'Game8 Latest News', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/296701', 'game8', '60 min', 60, array['game8', 'news', 'primary'], true),
  ('genshin-impact-game8-banners', 'genshin-impact', 'Game8 Banner Schedule', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/305012', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('genshin-impact-game8-v66', 'genshin-impact', 'Game8 Version 6.6', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/594202', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('genshin-impact-game8-v67', 'genshin-impact', 'Game8 Version 6.7', 'trusted_site', 'https://game8.co/games/Genshin-Impact/archives/602045', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('honkai-star-rail-game8-news', 'honkai-star-rail', 'Game8 Latest News', 'trusted_site', 'https://game8.co/games/Honkai-Star-Rail/archives/404257', 'game8', '60 min', 60, array['game8', 'news', 'primary'], true),
  ('honkai-star-rail-game8-banners', 'honkai-star-rail', 'Game8 All Banners', 'trusted_site', 'https://game8.co/games/Honkai-Star-Rail/archives/408381', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('honkai-star-rail-game8-events', 'honkai-star-rail', 'Game8 Events', 'trusted_site', 'https://game8.co/games/Honkai-Star-Rail/archives/408749', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('honkai-star-rail-game8-v43', 'honkai-star-rail', 'Game8 Version 4.3 Banners', 'trusted_site', 'https://game8.co/games/Honkai-Star-Rail/archives/591836', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('zenless-zone-zero-game8-news', 'zenless-zone-zero', 'Game8 News and Updates', 'trusted_site', 'https://game8.co/games/Zenless-Zone-Zero/archives/435682', 'game8', '60 min', 60, array['game8', 'news', 'primary'], true),
  ('zenless-zone-zero-game8-banners', 'zenless-zone-zero', 'Game8 Signal Search Banners', 'trusted_site', 'https://game8.co/games/Zenless-Zone-Zero/archives/435687', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('zenless-zone-zero-game8-events', 'zenless-zone-zero', 'Game8 Events', 'trusted_site', 'https://game8.co/games/Zenless-Zone-Zero/archives/457176', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('zenless-zone-zero-game8-v30', 'zenless-zone-zero', 'Game8 Version 3.0', 'trusted_site', 'https://game8.co/games/Zenless-Zone-Zero/archives/595942', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('wuthering-waves-game8-news', 'wuthering-waves', 'Game8 Latest News', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/452488', 'game8', '60 min', 60, array['game8', 'news', 'primary'], true),
  ('wuthering-waves-game8-banners', 'wuthering-waves', 'Game8 Convene Banners', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/453303', 'game8', '60 min', 60, array['game8', 'banners', 'primary'], true),
  ('wuthering-waves-game8-v35', 'wuthering-waves', 'Game8 Version 3.5', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/605253', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true),
  ('wuthering-waves-game8-v34', 'wuthering-waves', 'Game8 Version 3.4', 'trusted_site', 'https://game8.co/games/Wuthering-Waves/archives/599097', 'game8', '60 min', 60, array['game8', 'events', 'primary'], true)
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
