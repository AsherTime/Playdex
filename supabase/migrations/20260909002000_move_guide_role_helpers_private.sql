-- Move role-check helpers out of the exposed public API schema.

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

drop function if exists public.is_guide_writer();
drop function if exists public.is_app_admin();
drop function if exists public.current_app_role();
