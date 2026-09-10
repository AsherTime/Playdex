create table public.game_character_tier_lists (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  slug text not null,
  name text not null,
  version text,
  source_url text,
  source_updated_at timestamptz,
  seeded_at timestamptz not null default now(),
  tiers text[] not null,
  roles text[] not null,
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (game_id, slug),
  check (cardinality(tiers) > 0 and cardinality(roles) > 0)
);

create table public.game_character_tier_entries (
  tier_list_id uuid not null references public.game_character_tier_lists(id) on delete cascade,
  character_id text not null references public.game_characters(id),
  role text not null,
  tier text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  notes text check (length(notes) <= 2000),
  primary key (tier_list_id, character_id, role)
);
create index character_tier_entries_order_idx on public.game_character_tier_entries(tier_list_id, tier, role, sort_order);
create index character_tier_entries_character_idx on public.game_character_tier_entries(character_id);

alter table public.game_character_tier_lists enable row level security;
alter table public.game_character_tier_entries enable row level security;
revoke all on public.game_character_tier_lists, public.game_character_tier_entries from anon, authenticated;
grant select on public.game_character_tier_lists, public.game_character_tier_entries to anon, authenticated;
grant all on public.game_character_tier_lists, public.game_character_tier_entries to service_role;
create policy "Read published tier lists" on public.game_character_tier_lists for select to anon, authenticated using (true);
create policy "Read published tier entries" on public.game_character_tier_entries for select to anon, authenticated using (true);

create function app_private.check_character_tier_entry()
returns trigger language plpgsql security invoker set search_path='' as $$
declare list public.game_character_tier_lists; character_game text;
begin
  select * into strict list from public.game_character_tier_lists where id=new.tier_list_id;
  select game_id into character_game from public.game_characters where id=new.character_id;
  if character_game is distinct from list.game_id then
    raise exception 'Character and tier list must belong to the same game';
  end if;
  if not (new.tier=any(list.tiers)) or not (new.role=any(list.roles)) then
    raise exception 'Tier or role is not configured for this list';
  end if;
  return new;
end;
$$;
revoke all on function app_private.check_character_tier_entry() from public,anon,authenticated;
grant execute on function app_private.check_character_tier_entry() to service_role;
create trigger validate_character_tier_entry before insert or update on public.game_character_tier_entries
for each row execute function app_private.check_character_tier_entry();

-- Server actions verify the current user's protected profile role before using
-- this service-only function. The entire edit is one transaction.
create function public.save_character_tier_list(p_id uuid, p_revision integer, p_entries jsonb)
returns integer language plpgsql security invoker set search_path='' as $$
declare current_revision integer;
begin
  select revision into strict current_revision from public.game_character_tier_lists where id=p_id for update;
  if current_revision <> p_revision then
    raise exception 'This tier list changed in another session. Reload before saving.' using errcode='40001';
  end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries)>3000 then
    raise exception 'Invalid tier entries';
  end if;
  delete from public.game_character_tier_entries where tier_list_id=p_id;
  insert into public.game_character_tier_entries(tier_list_id, character_id, role, tier, sort_order, notes)
  select p_id, x.character_id, x.role, x.tier, x.sort_order, x.notes
  from jsonb_to_recordset(p_entries) x(character_id text, role text, tier text, sort_order integer, notes text);
  update public.game_character_tier_lists set revision=revision+1, updated_at=clock_timestamp() where id=p_id;
  return current_revision+1;
end;
$$;
revoke all on function public.save_character_tier_list(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.save_character_tier_list(uuid,integer,jsonb) to service_role;

create function public.seed_character_tier_list(p_list jsonb, p_entries jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare list_id uuid;
begin
  -- Unique game/slug rejects reruns rather than overwriting editorial changes.
  insert into public.game_character_tier_lists(game_id,slug,name,version,source_url,source_updated_at,tiers,roles)
  values(p_list->>'game_id',p_list->>'slug',p_list->>'name',p_list->>'version',p_list->>'source_url',
    (p_list->>'source_updated_at')::timestamptz,
    array(select jsonb_array_elements_text(p_list->'tiers')),
    array(select jsonb_array_elements_text(p_list->'roles')))
  returning id into list_id;
  perform public.save_character_tier_list(list_id,0,p_entries);
  return list_id;
end;
$$;
revoke all on function public.seed_character_tier_list(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.seed_character_tier_list(jsonb,jsonb) to service_role;
