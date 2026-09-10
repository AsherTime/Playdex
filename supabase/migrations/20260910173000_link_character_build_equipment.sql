-- Keep guide recommendations linked to canonical equipment records. Existing
-- guide JSON remains the writer-owned recommendation content.
create or replace function app_private.normalize_equipment_name(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(lower(value), '[^a-z0-9]+', '', 'g'),
    '[1-5]stars?$',
    '',
    'g'
  );
$$;

revoke all on function app_private.normalize_equipment_name(text)
  from public, anon, authenticated;
grant execute on function app_private.normalize_equipment_name(text)
  to service_role;

create or replace function app_private.sync_character_build_equipment(build_key text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  weapon_items integer := 0;
  weapon_links integer := 0;
  set_items integer := 0;
  set_links integer := 0;
begin
  delete from public.character_build_equipment_recommendations
  where build_id = build_key;

  with recommendation_items as (
    select b.id as build_id, c.game_id, groups.recommendation_group,
      entry.item, entry.ordinality
    from public.character_builds b
    join public.game_characters c on c.id = b.character_id
    cross join lateral (
      values
        ('best_weapon'::text, coalesce(b.best_weapons, '[]'::jsonb)),
        ('alternative_weapon'::text, coalesce(b.alternative_weapons, '[]'::jsonb)),
        ('f2p_weapon'::text, coalesce(b.f2p_weapons, '[]'::jsonb))
    ) as groups(recommendation_group, items)
    cross join lateral jsonb_array_elements(groups.items)
      with ordinality as entry(item, ordinality)
    where b.id = build_key and nullif(entry.item->>'name', '') is not null
  ), matched as (
    select items.*, target.id as equipment_id
    from recommendation_items items
    join lateral (
      select equipment.id
      from public.game_equipment equipment
      where equipment.game_id = items.game_id
        and equipment.equipment_category = 'weapon'
        and (
          equipment.source_id = items.item->>'sourceRef'
          or app_private.normalize_equipment_name(equipment.name)
            = app_private.normalize_equipment_name(items.item->>'name')
        )
      order by
        (equipment.source_id = coalesce(items.item->>'sourceRef', '')) desc,
        (equipment.source_site = 'nanoka') desc,
        equipment.id
      limit 1
    ) target on true
  ), ranked as (
    select
      build_id,
      equipment_id,
      recommendation_group,
      case
        when jsonb_typeof(item->'rank') = 'number'
          then greatest(1, (item->>'rank')::integer)
        else ordinality::integer
      end as rank_order,
      nullif(item->>'description', '') as recommendation_text
    from matched
  ), deduped as (
    select distinct on (build_id, equipment_id, recommendation_group)
      build_id, equipment_id, recommendation_group, rank_order, recommendation_text
    from ranked
    order by build_id, equipment_id, recommendation_group, rank_order, recommendation_text nulls last
  )
  insert into public.character_build_equipment_recommendations (
    build_id, equipment_id, recommendation_group, rank_order,
    recommendation_text
  )
  select build_id, equipment_id, recommendation_group, rank_order, recommendation_text
  from deduped
  on conflict (build_id, equipment_id, recommendation_group) do update set
    rank_order = excluded.rank_order,
    recommendation_text = excluded.recommendation_text;

  get diagnostics weapon_links = row_count;

  select count(*) into weapon_items
  from public.character_builds b
  cross join lateral (
    values
      (coalesce(b.best_weapons, '[]'::jsonb)),
      (coalesce(b.alternative_weapons, '[]'::jsonb)),
      (coalesce(b.f2p_weapons, '[]'::jsonb))
  ) as groups(items)
  cross join lateral jsonb_array_elements(groups.items) entry
  where b.id = build_key and nullif(entry->>'name', '') is not null;

  delete from public.character_build_set_recommendations
  where build_id = build_key;

  with recommendation_items as (
    select b.id as build_id, c.game_id, groups.recommendation_group,
      entry.item, entry.ordinality
    from public.character_builds b
    join public.game_characters c on c.id = b.character_id
    cross join lateral (
      values
        ('best_artifact'::text, coalesce(b.best_artifacts, '[]'::jsonb)),
        ('alternative_artifact'::text, coalesce(b.alternative_artifacts, '[]'::jsonb))
    ) as groups(recommendation_group, items)
    cross join lateral jsonb_array_elements(groups.items)
      with ordinality as entry(item, ordinality)
    where b.id = build_key and nullif(entry.item->>'name', '') is not null
  ), matched as (
    select items.*, target.id as set_id
    from recommendation_items items
    join lateral (
      select equipment_set.id
      from public.game_equipment_sets equipment_set
      where equipment_set.game_id = items.game_id
        and (
          equipment_set.source_id = items.item->>'sourceRef'
          or app_private.normalize_equipment_name(equipment_set.name)
            = app_private.normalize_equipment_name(items.item->>'name')
        )
      order by
        (equipment_set.source_id = coalesce(items.item->>'sourceRef', '')) desc,
        (equipment_set.source_site = 'nanoka') desc,
        equipment_set.id
      limit 1
    ) target on true
  ), ranked as (
    select
      build_id,
      set_id,
      recommendation_group,
      case
        when jsonb_typeof(item->'rank') = 'number'
          then greatest(1, (item->>'rank')::integer)
        else ordinality::integer
      end as rank_order,
      nullif(item->>'description', '') as recommendation_text
    from matched
  ), deduped as (
    select distinct on (build_id, set_id, recommendation_group)
      build_id, set_id, recommendation_group, rank_order, recommendation_text
    from ranked
    order by build_id, set_id, recommendation_group, rank_order, recommendation_text nulls last
  )
  insert into public.character_build_set_recommendations (
    build_id, set_id, recommendation_group, rank_order, pieces,
    recommendation_text
  )
  select build_id, set_id, recommendation_group, rank_order, null, recommendation_text
  from deduped
  on conflict (build_id, set_id, recommendation_group) do update set
    rank_order = excluded.rank_order,
    pieces = excluded.pieces,
    recommendation_text = excluded.recommendation_text;

  get diagnostics set_links = row_count;

  select count(*) into set_items
  from public.character_builds b
  cross join lateral (
    values
      (coalesce(b.best_artifacts, '[]'::jsonb)),
      (coalesce(b.alternative_artifacts, '[]'::jsonb))
  ) as groups(items)
  cross join lateral jsonb_array_elements(groups.items) entry
  where b.id = build_key and nullif(entry->>'name', '') is not null;

  return jsonb_build_object(
    'weapon_items', weapon_items,
    'weapon_links', weapon_links,
    'set_items', set_items,
    'set_links', set_links
  );
end;
$$;

revoke all on function app_private.sync_character_build_equipment(text)
  from public, anon, authenticated;
grant execute on function app_private.sync_character_build_equipment(text)
  to service_role;

create or replace function app_private.sync_character_build_equipment_trigger()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform app_private.sync_character_build_equipment(new.id);
  return new;
end;
$$;

revoke all on function app_private.sync_character_build_equipment_trigger()
  from public, anon, authenticated;
grant execute on function app_private.sync_character_build_equipment_trigger()
  to service_role;

drop trigger if exists sync_character_build_equipment on public.character_builds;
create trigger sync_character_build_equipment
after insert or update of best_weapons, alternative_weapons, f2p_weapons,
  best_artifacts, alternative_artifacts
on public.character_builds
for each row execute function app_private.sync_character_build_equipment_trigger();

do $$
declare
  build record;
begin
  for build in select id from public.character_builds loop
    perform app_private.sync_character_build_equipment(build.id);
  end loop;
end;
$$;
