-- Writer/editor workflow for Playdex guide revisions.
-- Public guide tables remain the published surface. Drafts and review state live
-- in guide_revisions and are protected by role-aware RLS.

alter table public.profiles
  add column if not exists app_role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_app_role_check;

alter table public.profiles
  add constraint profiles_app_role_check
  check (app_role in ('user', 'writer', 'admin'));

create index if not exists profiles_app_role_idx
  on public.profiles (app_role);

create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.current_app_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.app_role from public.profiles p where p.id = (select auth.uid())),
    'user'
  );
$$;

create or replace function app_private.is_app_admin()
returns boolean
language sql
security definer
set search_path = public, app_private
stable
as $$
  select app_private.current_app_role() = 'admin';
$$;

create or replace function app_private.is_guide_writer()
returns boolean
language sql
security definer
set search_path = public, app_private
stable
as $$
  select app_private.current_app_role() in ('writer', 'admin');
$$;

revoke all on function app_private.current_app_role() from public, anon, authenticated;
revoke all on function app_private.is_app_admin() from public, anon, authenticated;
revoke all on function app_private.is_guide_writer() from public, anon, authenticated;
grant execute on function app_private.current_app_role() to anon, authenticated;
grant execute on function app_private.is_app_admin() to anon, authenticated;
grant execute on function app_private.is_guide_writer() to anon, authenticated;

drop policy if exists "profiles_select_admin_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or app_private.is_app_admin());

revoke insert, update on public.profiles from anon, authenticated;
revoke insert (app_role), update (app_role) on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;

do $$
declare
  insert_columns text;
  update_columns text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into insert_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name not in ('app_role', 'created_at', 'updated_at');

  if insert_columns is not null then
    execute format('grant insert (%s) on public.profiles to authenticated', insert_columns);
  end if;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into update_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name not in ('id', 'email', 'app_role', 'created_at', 'updated_at');

  if update_columns is not null then
    execute format('grant update (%s) on public.profiles to authenticated', update_columns);
  end if;
end;
$$;

alter table public.character_builds
  add column if not exists rotation_playstyle text;

update public.character_builds
set rotation_playstyle = nullif(
  (
    select string_agg(coalesce(step ->> 'text', ''), E'\n' order by ordinality)
    from jsonb_array_elements(coalesce(rotation, '[]'::jsonb)) with ordinality as steps(step, ordinality)
  ),
  ''
)
where rotation_playstyle is null;

create table if not exists public.guide_revisions (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  character_id text not null references public.game_characters(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft',
  title text,
  sections_changed text[] not null default '{}',
  base_kit jsonb,
  draft_kit jsonb,
  base_build jsonb,
  draft_build jsonb,
  base_teams jsonb,
  draft_teams jsonb,
  base_version jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guide_revisions_status_check
    check (status in ('draft', 'pending_review', 'approved', 'published', 'rejected'))
);

create index if not exists guide_revisions_character_status_idx
  on public.guide_revisions (character_id, status, updated_at desc);

create index if not exists guide_revisions_author_status_idx
  on public.guide_revisions (author_user_id, status, updated_at desc);

create index if not exists guide_revisions_game_id_idx
  on public.guide_revisions (game_id);

create index if not exists guide_revisions_reviewed_by_idx
  on public.guide_revisions (reviewed_by);

create index if not exists guide_revisions_pending_idx
  on public.guide_revisions (status, submitted_at desc)
  where status = 'pending_review';

drop trigger if exists guide_revisions_set_updated_at on public.guide_revisions;
create trigger guide_revisions_set_updated_at
  before update on public.guide_revisions
  for each row execute function public.set_updated_at();

alter table public.guide_revisions enable row level security;

drop policy if exists "Guide revisions are visible to owners and admins" on public.guide_revisions;
create policy "Guide revisions are visible to owners and admins"
  on public.guide_revisions for select
  to authenticated
  using (
    author_user_id = (select auth.uid())
    or app_private.is_app_admin()
  );

drop policy if exists "Guide writers can create own drafts" on public.guide_revisions;
create policy "Guide writers can create own drafts"
  on public.guide_revisions for insert
  to authenticated
  with check (
    app_private.is_guide_writer()
    and author_user_id = (select auth.uid())
    and status = 'draft'
  );

drop policy if exists "Guide writers can update own editable revisions" on public.guide_revisions;
create policy "Guide writers can update own editable revisions"
  on public.guide_revisions for update
  to authenticated
  using (
    app_private.is_app_admin()
    or (
      app_private.is_guide_writer()
      and author_user_id = (select auth.uid())
      and status in ('draft', 'rejected')
    )
  )
  with check (
    app_private.is_app_admin()
    or (
      app_private.is_guide_writer()
      and author_user_id = (select auth.uid())
      and status in ('draft', 'pending_review')
    )
  );

grant select, insert, update on public.guide_revisions to authenticated;
