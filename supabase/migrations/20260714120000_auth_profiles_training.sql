-- Auth profiles, followed games, and training progress

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  age integer check (age is null or (age >= 1 and age <= 120)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_followed_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, game_slug)
);

create table if not exists public.user_training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_slug text not null,
  plan_day integer not null check (plan_day >= 1 and plan_day <= 30),
  task_id text not null,
  task_title text not null default '',
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_slug, plan_day, task_id)
);

create index if not exists user_followed_games_user_id_idx
  on public.user_followed_games (user_id);

create index if not exists user_training_progress_user_game_idx
  on public.user_training_progress (user_id, game_slug);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_training_progress_set_updated_at on public.user_training_progress;
create trigger user_training_progress_set_updated_at
  before update on public.user_training_progress
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_followed_games enable row level security;
alter table public.user_training_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "followed_games_select_own" on public.user_followed_games;
create policy "followed_games_select_own"
  on public.user_followed_games for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "followed_games_insert_own" on public.user_followed_games;
create policy "followed_games_insert_own"
  on public.user_followed_games for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "followed_games_update_own" on public.user_followed_games;
create policy "followed_games_update_own"
  on public.user_followed_games for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "followed_games_delete_own" on public.user_followed_games;
create policy "followed_games_delete_own"
  on public.user_followed_games for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "training_progress_select_own" on public.user_training_progress;
create policy "training_progress_select_own"
  on public.user_training_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "training_progress_insert_own" on public.user_training_progress;
create policy "training_progress_insert_own"
  on public.user_training_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "training_progress_update_own" on public.user_training_progress;
create policy "training_progress_update_own"
  on public.user_training_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "training_progress_delete_own" on public.user_training_progress;
create policy "training_progress_delete_own"
  on public.user_training_progress for delete
  to authenticated
  using (auth.uid() = user_id);
