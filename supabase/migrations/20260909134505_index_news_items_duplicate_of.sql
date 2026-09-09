create index if not exists news_items_duplicate_of_idx
  on public.news_items (duplicate_of)
  where duplicate_of is not null;
