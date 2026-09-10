-- Refuse retirement unless the original records and every canonical component
-- Version matches the migration applied through the Supabase connector.
-- are present. No CASCADE: unexpected consumers must block removal.
do $$
begin
 if (select count(*) from public.game_weapons)<>(select count(*) from public.game_equipment where game_id='genshin-impact' and source_site='nanoka')
 or (select count(*) from public.game_artifact_sets)<>(select count(*) from public.game_equipment_sets where game_id='genshin-impact' and source_site='nanoka') then
 raise exception 'Legacy equipment counts differ'; end if;
 if exists(select 1 from public.game_weapons w left join public.game_equipment e using(id)
 where e.id is null or w.raw_data<>e.raw_data or w.content_hash<>e.content_hash or w.imported_at<>e.imported_at
 or (to_jsonb(w)-'raw_data')<>e.metadata->'legacy_snapshot' or w.stat_progression<>e.metadata->'progression')
 or exists(select 1 from public.game_artifact_sets a left join public.game_equipment_sets s using(id)
 where s.id is null or a.raw_data<>s.raw_data or (to_jsonb(a)-'raw_data')<>s.metadata->'legacy_snapshot') then
 raise exception 'Legacy equipment fields differ'; end if;
 if exists(select 1 from public.game_weapons w cross join lateral jsonb_array_elements(w.refinement_values) r
 left join public.game_equipment_effects e on e.equipment_id=w.id and e.effect_key='main' and e.rank=(r->>'rank')::int
 where e.equipment_id is null or e.name is distinct from r->>'name' or e.description is distinct from r->>'description' or e.parameters->'values' is distinct from r->'values') then
 raise exception 'Legacy effects differ'; end if;
 if exists(select 1 from public.game_artifact_sets a cross join lateral jsonb_array_elements(a.set_effects) r
 left join public.game_equipment_set_bonuses b on b.set_id=a.id and b.effect_key=r->>'source_effect_id'
 where b.set_id is null or b.pieces_required<>(r->>'pieces')::int or b.description is distinct from r->>'description'
 or b.parameters->'values' is distinct from r->'values' or b.parameters->'add_props' is distinct from r->'add_props') then
 raise exception 'Legacy set bonuses differ'; end if;
 if exists(select 1 from public.game_weapons w
 cross join lateral jsonb_each(coalesce(w.raw_data->'stats_modifier','{}')) m
 cross join lateral jsonb_each_text(m.value->'levels') l
 left join public.game_equipment_stats s on s.equipment_id=w.id
 and s.stat_key=case when m.key='atk' then 'base_attack' else replace(m.key,'fight_prop_','') end
 and s.level=l.key::int and s.ascension is null
 where m.key<>'fight_prop_none' and (s.equipment_id is null or s.value<>round((m.value->>'base')::numeric*l.value::numeric,10))) then
 raise exception 'Legacy level curves differ'; end if;
 if exists(select 1 from public.game_weapons w
 cross join lateral jsonb_each(coalesce(w.raw_data->'ascension','{}')) a
 cross join lateral jsonb_each_text(a.value) p
 left join public.game_equipment_stats s on s.equipment_id=w.id and s.level is null
 and s.ascension=a.key::int and s.stat_key=replace(p.key,'fight_prop_','')
 where s.equipment_id is null or s.value<>p.value::numeric) then
 raise exception 'Legacy ascension values differ'; end if;
end $$;

drop table public.game_weapons;
drop table public.game_artifact_sets;

-- Build references must stay in the character's game.
create function app_private.check_build_equipment_game()
returns trigger language plpgsql security invoker set search_path='' as $$
declare build_game text; target_game text;
begin
 select c.game_id into build_game from public.character_builds b
 join public.game_characters c on c.id=b.character_id where b.id=new.build_id;
 if tg_table_name='character_build_equipment_recommendations' then
  select game_id into target_game from public.game_equipment where id=new.equipment_id;
 else
  select game_id into target_game from public.game_equipment_sets where id=new.set_id;
 end if;
 if build_game is null or target_game is null or build_game<>target_game then
  raise exception 'Build and canonical equipment must belong to the same game' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function app_private.check_build_equipment_game() from public,anon,authenticated;
grant execute on function app_private.check_build_equipment_game() to service_role;
create trigger check_build_equipment_game before insert or update on public.character_build_equipment_recommendations
for each row execute function app_private.check_build_equipment_game();
create trigger check_build_set_game before insert or update on public.character_build_set_recommendations
for each row execute function app_private.check_build_equipment_game();
