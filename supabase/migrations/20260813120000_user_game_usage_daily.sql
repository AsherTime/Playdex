-- Daily summarized Android game usage per user (opt-in sync from the app)

create table if not exists public.user_game_usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  game_slug text not null,
  playtime_seconds integer not null default 0 check (playtime_seconds >= 0),
  session_count integer not null default 0 check (session_count >= 0),
  last_played_at timestamptz,
  source text not null default 'android' check (source = 'android'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_date, game_slug)
);

create index if not exists user_game_usage_daily_user_date_idx
  on public.user_game_usage_daily (user_id, usage_date desc);

drop trigger if exists user_game_usage_daily_set_updated_at on public.user_game_usage_daily;
create trigger user_game_usage_daily_set_updated_at
  before update on public.user_game_usage_daily
  for each row execute function public.set_updated_at();

alter table public.user_game_usage_daily enable row level security;

drop policy if exists "game_usage_daily_select_own" on public.user_game_usage_daily;
create policy "game_usage_daily_select_own"
  on public.user_game_usage_daily for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "game_usage_daily_insert_own" on public.user_game_usage_daily;
create policy "game_usage_daily_insert_own"
  on public.user_game_usage_daily for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "game_usage_daily_update_own" on public.user_game_usage_daily;
create policy "game_usage_daily_update_own"
  on public.user_game_usage_daily for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "game_usage_daily_delete_own" on public.user_game_usage_daily;
create policy "game_usage_daily_delete_own"
  on public.user_game_usage_daily for delete
  to authenticated
  using (auth.uid() = user_id);
