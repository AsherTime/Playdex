-- Improve auth profile reliability and server-only account checks.

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'display_name', ''), '')
  )
  on conflict (id) do update set email = excluded.email;
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
set search_path = public
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

alter table public.profiles enable row level security;
alter table public.user_followed_games enable row level security;
alter table public.user_training_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "followed_games_select_own" on public.user_followed_games;
create policy "followed_games_select_own"
  on public.user_followed_games for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "followed_games_insert_own" on public.user_followed_games;
create policy "followed_games_insert_own"
  on public.user_followed_games for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "followed_games_update_own" on public.user_followed_games;
create policy "followed_games_update_own"
  on public.user_followed_games for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "followed_games_delete_own" on public.user_followed_games;
create policy "followed_games_delete_own"
  on public.user_followed_games for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "training_progress_select_own" on public.user_training_progress;
create policy "training_progress_select_own"
  on public.user_training_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "training_progress_insert_own" on public.user_training_progress;
create policy "training_progress_insert_own"
  on public.user_training_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "training_progress_update_own" on public.user_training_progress;
create policy "training_progress_update_own"
  on public.user_training_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "training_progress_delete_own" on public.user_training_progress;
create policy "training_progress_delete_own"
  on public.user_training_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_followed_games to authenticated;
grant select, insert, update, delete on public.user_training_progress to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

insert into public.profiles (id, email, name, created_at, updated_at)
select
  u.id,
  coalesce(u.email, ''),
  nullif(coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'display_name', ''), ''),
  now(),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

create or replace function public.check_auth_email_status(check_email text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  matched_confirmed_at timestamptz;
begin
  if check_email is null or length(trim(check_email)) = 0 then
    return 'not_found';
  end if;

  select u.email_confirmed_at
    into matched_confirmed_at
  from auth.users u
  where lower(u.email) = lower(trim(check_email))
  order by u.created_at asc
  limit 1;

  if not found then
    return 'not_found';
  end if;

  if matched_confirmed_at is null then
    return 'unconfirmed';
  end if;

  return 'confirmed';
end;
$$;

revoke all on function public.check_auth_email_status(text) from public, anon, authenticated;
grant execute on function public.check_auth_email_status(text) to service_role;
