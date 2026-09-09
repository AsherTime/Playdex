drop index if exists public.news_items_canonical_url_unique_idx;

create index if not exists news_items_canonical_url_idx
  on public.news_items (canonical_url)
  where canonical_url is not null;
