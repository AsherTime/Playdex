-- Gaming identity, public profiles, and aggregated usage RPCs

alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists profile_visibility text not null default 'private'
    check (profile_visibility in ('public', 'private')),
  add column if not exists show_playtime boolean not null default false,
  add column if not exists show_weekly_playtime boolean not null default false,
  add column if not exists show_recent_games boolean not null default false,
  add column if not exists show_improvement_plan boolean not null default false,
  add column if not exists show_favorite_games boolean not null default false,
  add column if not exists show_streak boolean not null default false,
  add column if not exists main_game_slug text,
  add column if not exists show_platform boolean not null default false,
  add column if not exists improvement_snapshot jsonb;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check
  check (
    username is null
    or (
      username = lower(username)
      and username ~ '^[a-z0-9_]{3,24}$'
    )
  );

-- Aggregated usage for dashboards (owner or security-definer public wrapper)
create or replace function public.get_gaming_usage_aggregates(
  p_user_id uuid,
  p_days integer default 7
)
returns table (
  game_slug text,
  total_playtime_seconds bigint,
  last_played_at timestamptz,
  active_days bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.game_slug,
    sum(u.playtime_seconds)::bigint as total_playtime_seconds,
    max(u.last_played_at) as last_played_at,
    count(distinct u.usage_date)::bigint as active_days
  from public.user_game_usage_daily u
  where u.user_id = p_user_id
    and u.usage_date >= (current_date - greatest(p_days - 1, 0))
  group by u.game_slug
  order by total_playtime_seconds desc;
$$;

create or replace function public.get_gaming_usage_totals(
  p_user_id uuid,
  p_days integer default 7
)
returns table (
  total_playtime_seconds bigint,
  games_played bigint,
  active_days bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(sum(u.playtime_seconds), 0)::bigint as total_playtime_seconds,
    count(distinct u.game_slug)::bigint as games_played,
    count(distinct u.usage_date)::bigint as active_days
  from public.user_game_usage_daily u
  where u.user_id = p_user_id
    and u.usage_date >= (current_date - greatest(p_days - 1, 0));
$$;

create or replace function public.get_public_gaming_profile(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_profile public.profiles%rowtype;
  v_viewer uuid;
  v_is_owner boolean;
  v_can_view boolean;
  v_week_totals record;
  v_month_totals record;
  v_games jsonb;
  v_followed jsonb;
  v_improvement jsonb;
begin
  v_viewer := auth.uid();

  select *
  into v_profile
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;

  if not found then
    return null;
  end if;

  v_is_owner := v_viewer is not null and v_viewer = v_profile.id;
  v_can_view := v_profile.profile_visibility = 'public' or v_is_owner;

  if not v_can_view then
    return jsonb_build_object(
      'private', true,
      'username', v_profile.username
    );
  end if;

  select *
  into v_week_totals
  from public.get_gaming_usage_totals(v_profile.id, 7);

  select *
  into v_month_totals
  from public.get_gaming_usage_totals(v_profile.id, 30);

  if v_profile.show_recent_games or v_is_owner then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'gameSlug', g.game_slug,
          'totalPlaytimeSeconds', g.total_playtime_seconds,
          'lastPlayedAt', g.last_played_at,
          'activeDays', g.active_days
        )
        order by g.total_playtime_seconds desc
      ),
      '[]'::jsonb
    )
    into v_games
    from public.get_gaming_usage_aggregates(v_profile.id, 7) g;
  else
    v_games := '[]'::jsonb;
  end if;

  if v_profile.show_favorite_games or v_is_owner then
    select coalesce(
      jsonb_agg(f.game_slug order by f.created_at),
      '[]'::jsonb
    )
    into v_followed
    from public.user_followed_games f
    where f.user_id = v_profile.id;
  else
    v_followed := '[]'::jsonb;
  end if;

  if (v_profile.show_improvement_plan or v_is_owner) and v_profile.improvement_snapshot is not null then
    v_improvement := v_profile.improvement_snapshot;
  else
    v_improvement := null;
  end if;

  return jsonb_build_object(
    'private', false,
    'isOwner', v_is_owner,
    'id', v_profile.id,
    'username', v_profile.username,
    'displayName', coalesce(v_profile.name, v_profile.username),
    'bio', v_profile.bio,
    'avatarUrl', v_profile.avatar_url,
    'joinedAt', v_profile.created_at,
    'mainGameSlug', v_profile.main_game_slug,
    'profileVisibility', v_profile.profile_visibility,
    'privacy', jsonb_build_object(
      'showPlaytime', v_profile.show_playtime,
      'showWeeklyPlaytime', v_profile.show_weekly_playtime,
      'showRecentGames', v_profile.show_recent_games,
      'showImprovementPlan', v_profile.show_improvement_plan,
      'showFavoriteGames', v_profile.show_favorite_games,
      'showStreak', v_profile.show_streak,
      'showPlatform', v_profile.show_platform
    ),
    'stats', case
      when v_profile.show_playtime or v_profile.show_weekly_playtime or v_is_owner then
        jsonb_build_object(
          'weekTotalSeconds', case when v_profile.show_weekly_playtime or v_is_owner then v_week_totals.total_playtime_seconds else null end,
          'monthTotalSeconds', case when v_profile.show_playtime or v_is_owner then v_month_totals.total_playtime_seconds else null end,
          'weekGamesPlayed', case when v_profile.show_weekly_playtime or v_is_owner then v_week_totals.games_played else null end,
          'activeDays', case when v_profile.show_streak or v_is_owner then v_week_totals.active_days else null end
        )
      else null
    end,
    'recentGames', case when v_profile.show_recent_games or v_is_owner then v_games else '[]'::jsonb end,
    'favoriteGames', case when v_profile.show_favorite_games or v_is_owner then v_followed else '[]'::jsonb end,
    'improvement', v_improvement
  );
end;
$$;

revoke all on function public.get_gaming_usage_aggregates(uuid, integer) from public;
revoke all on function public.get_gaming_usage_totals(uuid, integer) from public;
revoke all on function public.get_public_gaming_profile(text) from public;

grant execute on function public.get_gaming_usage_aggregates(uuid, integer) to authenticated;
grant execute on function public.get_gaming_usage_totals(uuid, integer) to authenticated;
grant execute on function public.get_public_gaming_profile(text) to anon, authenticated;
