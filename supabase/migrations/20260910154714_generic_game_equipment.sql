-- Version matches the migration applied through the Supabase connector.
create table public.game_equipment (
 id uuid primary key default gen_random_uuid(),
 game_id text not null references public.games(id),
 source_site text not null, source_id text not null,
 slug text not null, name text not null,
 equipment_category text not null, equipment_type text,
 rarity integer, icon_url text,
 source_url text not null, source_data_url text, source_version text,
 metadata jsonb not null default '{}', raw_data jsonb not null default '{}', content_hash text,
 imported_at timestamptz not null default now(), last_checked_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(game_id,source_site,source_id)
);
create index game_equipment_slug_idx on public.game_equipment(game_id,slug);
create index game_equipment_category_type_idx on public.game_equipment(game_id,equipment_category,equipment_type);
create index game_equipment_type_idx on public.game_equipment(game_id,equipment_type);
create table public.game_equipment_stats (
 equipment_id uuid not null references public.game_equipment(id) on delete cascade,
 stat_key text not null, stat_name text, value numeric, display_value text,
 level integer, ascension integer, sort_order integer not null default 0,
 metadata jsonb not null default '{}',
 unique nulls not distinct(equipment_id,stat_key,level,ascension)
);
create table public.game_equipment_effects (
 equipment_id uuid not null references public.game_equipment(id) on delete cascade,
 effect_type text not null, effect_key text not null, name text,
 rank integer not null default 1, description text, parameters jsonb not null default '{}',
 sort_order integer not null default 0, metadata jsonb not null default '{}',
 primary key(equipment_id,effect_type,effect_key,rank)
);
create table public.game_equipment_sets (
 id uuid primary key default gen_random_uuid(),
 game_id text not null references public.games(id),
 source_site text not null, source_id text not null,
 slug text not null, name text not null, set_category text not null,
 icon_url text, rarities integer[],
 source_url text not null, source_data_url text, source_version text,
 metadata jsonb not null default '{}', raw_data jsonb not null default '{}', content_hash text,
 imported_at timestamptz not null default now(), last_checked_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(game_id,source_site,source_id)
);
create index game_equipment_sets_slug_idx on public.game_equipment_sets(game_id,slug);
create index game_equipment_sets_category_idx on public.game_equipment_sets(game_id,set_category);
create table public.game_equipment_set_bonuses (
 set_id uuid not null references public.game_equipment_sets(id) on delete cascade,
 pieces_required integer not null check(pieces_required>0), effect_key text not null,
 description text, parameters jsonb not null default '{}', sort_order integer not null default 0,
 metadata jsonb not null default '{}',
 primary key(set_id,pieces_required,effect_key)
);

-- Future recommendations reference canonical identities, not copied stats.
create table public.character_build_equipment_recommendations (
 build_id text not null references public.character_builds(id) on delete cascade,
 equipment_id uuid not null references public.game_equipment(id),
 recommendation_group text not null default 'recommended',
 rank_order integer not null default 1, recommendation_text text,
 primary key(build_id,equipment_id,recommendation_group)
);
create index character_build_equipment_target_idx on public.character_build_equipment_recommendations(equipment_id);
create table public.character_build_set_recommendations (
 build_id text not null references public.character_builds(id) on delete cascade,
 set_id uuid not null references public.game_equipment_sets(id),
 recommendation_group text not null default 'recommended',
 rank_order integer not null default 1, pieces integer, recommendation_text text,
 primary key(build_id,set_id,recommendation_group)
);
create index character_build_set_target_idx on public.character_build_set_recommendations(set_id);

alter table public.game_equipment enable row level security;
create policy "Public canonical data" on public.game_equipment for select to anon, authenticated using (true);
revoke all on public.game_equipment from anon,authenticated;
grant select on public.game_equipment to anon,authenticated;
grant all on public.game_equipment to service_role;

alter table public.game_equipment_stats enable row level security;
create policy "Public canonical data" on public.game_equipment_stats for select to anon, authenticated using (true);
revoke all on public.game_equipment_stats from anon,authenticated;
grant select on public.game_equipment_stats to anon,authenticated;
grant all on public.game_equipment_stats to service_role;

alter table public.game_equipment_effects enable row level security;
create policy "Public canonical data" on public.game_equipment_effects for select to anon, authenticated using (true);
revoke all on public.game_equipment_effects from anon,authenticated;
grant select on public.game_equipment_effects to anon,authenticated;
grant all on public.game_equipment_effects to service_role;

alter table public.game_equipment_sets enable row level security;
create policy "Public canonical data" on public.game_equipment_sets for select to anon, authenticated using (true);
revoke all on public.game_equipment_sets from anon,authenticated;
grant select on public.game_equipment_sets to anon,authenticated;
grant all on public.game_equipment_sets to service_role;

alter table public.game_equipment_set_bonuses enable row level security;
create policy "Public canonical data" on public.game_equipment_set_bonuses for select to anon, authenticated using (true);
revoke all on public.game_equipment_set_bonuses from anon,authenticated;
grant select on public.game_equipment_set_bonuses to anon,authenticated;
grant all on public.game_equipment_set_bonuses to service_role;

alter table public.character_build_equipment_recommendations enable row level security;
create policy "Public canonical data" on public.character_build_equipment_recommendations for select to anon, authenticated using (true);
revoke all on public.character_build_equipment_recommendations from anon,authenticated;
grant select on public.character_build_equipment_recommendations to anon,authenticated;
grant all on public.character_build_equipment_recommendations to service_role;

alter table public.character_build_set_recommendations enable row level security;
create policy "Public canonical data" on public.character_build_set_recommendations for select to anon, authenticated using (true);
revoke all on public.character_build_set_recommendations from anon,authenticated;
grant select on public.character_build_set_recommendations to anon,authenticated;
grant all on public.character_build_set_recommendations to service_role;

-- Preserve original IDs, source data and timestamps. The snapshot also retains
-- every legacy normalized field for migration auditing.
insert into public.game_equipment
(id,game_id,source_site,source_id,slug,name,equipment_category,equipment_type,rarity,icon_url,source_url,source_data_url,source_version,metadata,raw_data,content_hash,imported_at,last_checked_at)
select id,game_id,source_site,source_id,slug,name,'weapon',lower(replace(weapon_type,' ','_')),rarity,icon_url,source_url,source_data_url,source_version,
jsonb_build_object('legacy_snapshot',to_jsonb(w)-'raw_data','progression',stat_progression,'icon_key',icon_key,'rank_terminology','refinement'),raw_data,content_hash,imported_at,last_checked_at
from public.game_weapons w;

insert into public.game_equipment_sets
(id,game_id,source_site,source_id,slug,name,set_category,icon_url,rarities,source_url,source_data_url,source_version,metadata,raw_data,content_hash,imported_at,last_checked_at)
select id,game_id,source_site,source_id,slug,name,'artifact',icon_url,rarities,source_url,source_data_url,source_version,
jsonb_build_object('legacy_snapshot',to_jsonb(a)-'raw_data','icon_key',icon_key),raw_data,content_hash,imported_at,last_checked_at
from public.game_artifact_sets a;

insert into public.game_equipment_effects(equipment_id,effect_type,effect_key,name,rank,description,parameters,sort_order)
select w.id,'passive','main',r->>'name',(r->>'rank')::int,r->>'description',
jsonb_build_object('values',r->'values'),(r->>'rank')::int
from public.game_weapons w cross join lateral jsonb_array_elements(w.refinement_values) r;

insert into public.game_equipment_set_bonuses(set_id,pieces_required,effect_key,description,parameters,sort_order)
select a.id,(r->>'pieces')::int,coalesce(r->>'source_effect_id',ord::text),r->>'description',
jsonb_build_object('values',r->'values','add_props',r->'add_props'),ord::int-1
from public.game_artifact_sets a cross join lateral jsonb_array_elements(a.set_effects) with ordinality as x(r,ord);

-- Curves have no selected ascension; bonus rows have no selected level.
insert into public.game_equipment_stats(equipment_id,stat_key,stat_name,value,level,ascension,sort_order,metadata)
select w.id,case when m.key='atk' then 'base_attack' else replace(m.key,'fight_prop_','') end,
case when m.key='atk' then 'ATK' else w.secondary_stat_name end,
round((m.value->>'base')::numeric*l.value::numeric,10),l.key::int,null,
case when m.key='atk' then 0 else 1 end,
jsonb_build_object('component','level_curve','source_modifier',m.key)
from public.game_weapons w
cross join lateral jsonb_each(coalesce(w.raw_data->'stats_modifier','{}')) m
cross join lateral jsonb_each_text(m.value->'levels') l
where m.key<>'fight_prop_none';

insert into public.game_equipment_stats(equipment_id,stat_key,stat_name,value,level,ascension,sort_order,metadata)
select w.id,replace(p.key,'fight_prop_',''),'Ascension bonus',p.value::numeric,null,a.key::int,2,
jsonb_build_object('component','ascension_bonus','source_property',p.key)
from public.game_weapons w
cross join lateral jsonb_each(coalesce(w.raw_data->'ascension','{}')) a
cross join lateral jsonb_each_text(a.value) p;

-- Each import atomically replaces a canonical record's children. Parent UUIDs
-- survive reruns and parent locks serialize concurrent imports of the same item.

create function public.import_game_equipment(p_record jsonb, p_children jsonb, p_effects jsonb default '[]')
returns uuid language plpgsql security invoker set search_path='' as $$
declare target_id uuid;
begin
 insert into public.game_equipment(game_id,source_site,source_id,slug,name,equipment_category,equipment_type,rarity,icon_url,source_url,source_data_url,source_version,metadata,raw_data,content_hash,last_checked_at)
 values (p_record->>'game_id',p_record->>'source_site',p_record->>'source_id',p_record->>'slug',p_record->>'name',p_record->>'equipment_category',p_record->>'equipment_type',(p_record->>'rarity')::int,p_record->>'icon_url',p_record->>'source_url',p_record->>'source_data_url',p_record->>'source_version',p_record->'metadata',p_record->'raw_data',p_record->>'content_hash',coalesce((p_record->>'last_checked_at')::timestamptz,now()))
 on conflict(game_id,source_site,source_id) do update set
 slug=excluded.slug,name=excluded.name,equipment_category=excluded.equipment_category,
 equipment_type=excluded.equipment_type,rarity=excluded.rarity,
 icon_url=excluded.icon_url,source_url=excluded.source_url,source_data_url=excluded.source_data_url,
 source_version=excluded.source_version,metadata=game_equipment.metadata||excluded.metadata,
 raw_data=excluded.raw_data,content_hash=excluded.content_hash,last_checked_at=excluded.last_checked_at,updated_at=now()
 returning id into target_id;
 
 delete from public.game_equipment_stats where equipment_id=target_id;
 insert into public.game_equipment_stats(equipment_id,stat_key,stat_name,value,display_value,level,ascension,sort_order,metadata)
 select target_id,x.stat_key,x.stat_name,x.value,x.display_value,x.level,x.ascension,x.sort_order,coalesce(x.metadata,'{}')
 from jsonb_to_recordset(p_children) as x(stat_key text,stat_name text,value numeric,display_value text,level int,ascension int,sort_order int,metadata jsonb);
 delete from public.game_equipment_effects where equipment_id=target_id;
 insert into public.game_equipment_effects(equipment_id,effect_type,effect_key,name,rank,description,parameters,sort_order,metadata)
 select target_id,x.effect_type,x.effect_key,x.name,x.rank,x.description,x.parameters,x.sort_order,coalesce(x.metadata,'{}')
 from jsonb_to_recordset(p_effects) as x(effect_type text,effect_key text,name text,rank int,description text,parameters jsonb,sort_order int,metadata jsonb);
 
 return target_id;
end;
$$;
revoke all on function public.import_game_equipment(jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.import_game_equipment(jsonb,jsonb,jsonb) to service_role;

create function public.import_game_equipment_set(p_record jsonb, p_children jsonb, p_effects jsonb default '[]')
returns uuid language plpgsql security invoker set search_path='' as $$
declare target_id uuid;
begin
 insert into public.game_equipment_sets(game_id,source_site,source_id,slug,name,set_category,rarities,icon_url,source_url,source_data_url,source_version,metadata,raw_data,content_hash,last_checked_at)
 values (p_record->>'game_id',p_record->>'source_site',p_record->>'source_id',p_record->>'slug',p_record->>'name',p_record->>'set_category',case when p_record->'rarities' <> 'null'::jsonb then array(select jsonb_array_elements_text(p_record->'rarities')::int) end,p_record->>'icon_url',p_record->>'source_url',p_record->>'source_data_url',p_record->>'source_version',p_record->'metadata',p_record->'raw_data',p_record->>'content_hash',coalesce((p_record->>'last_checked_at')::timestamptz,now()))
 on conflict(game_id,source_site,source_id) do update set
 slug=excluded.slug,name=excluded.name,set_category=excluded.set_category,
 rarities=excluded.rarities,
 icon_url=excluded.icon_url,source_url=excluded.source_url,source_data_url=excluded.source_data_url,
 source_version=excluded.source_version,metadata=game_equipment_sets.metadata||excluded.metadata,
 raw_data=excluded.raw_data,content_hash=excluded.content_hash,last_checked_at=excluded.last_checked_at,updated_at=now()
 returning id into target_id;
 
 delete from public.game_equipment_set_bonuses where set_id=target_id;
 insert into public.game_equipment_set_bonuses(set_id,pieces_required,effect_key,description,parameters,sort_order,metadata)
 select target_id,x.pieces_required,x.effect_key,x.description,x.parameters,x.sort_order,coalesce(x.metadata,'{}')
 from jsonb_to_recordset(p_children) as x(pieces_required int,effect_key text,description text,parameters jsonb,sort_order int,metadata jsonb);
 
 return target_id;
end;
$$;
revoke all on function public.import_game_equipment_set(jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.import_game_equipment_set(jsonb,jsonb,jsonb) to service_role;

do $$ begin
 if (select count(*) from public.game_weapons)<>(select count(*) from public.game_equipment)
 or (select count(*) from public.game_artifact_sets)<>(select count(*) from public.game_equipment_sets) then
 raise exception 'Equipment migration count mismatch'; end if;
 if exists(select 1 from public.game_weapons w join public.game_equipment e using(id) where w.raw_data<>e.raw_data or w.icon_url is distinct from e.icon_url)
 or exists(select 1 from public.game_artifact_sets a join public.game_equipment_sets s using(id) where a.raw_data<>s.raw_data or a.icon_url is distinct from s.icon_url) then
 raise exception 'Equipment migration data mismatch'; end if;
end $$;
