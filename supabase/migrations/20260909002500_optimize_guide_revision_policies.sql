-- Advisor cleanup for the guide writer workflow.

create index if not exists guide_revisions_game_id_idx
  on public.guide_revisions (game_id);

create index if not exists guide_revisions_reviewed_by_idx
  on public.guide_revisions (reviewed_by);

drop policy if exists "profiles_select_admin_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or app_private.is_app_admin());
