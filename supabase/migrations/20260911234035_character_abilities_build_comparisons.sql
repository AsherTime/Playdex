create table public.character_abilities (
  id text primary key,
  game_id text not null references public.games(id),
  character_id text not null references public.game_characters(id) on delete cascade,
  source_site text not null, source_id text not null,
  ability_type text not null, name text not null, description text not null,
  icon_url text, sort_order integer not null default 0,
  source_url text not null, source_version text,
  raw_data jsonb not null default '{}',
  imported_at timestamptz not null default now(), last_checked_at timestamptz not null default now(),
  unique(character_id,source_site,source_id)
);
create index character_abilities_character_idx on public.character_abilities(character_id,ability_type);
create index character_abilities_game_idx on public.character_abilities(game_id);

create table public.character_build_comparisons (
  id text primary key,
  game_id text not null references public.games(id),
  character_id text not null references public.game_characters(id) on delete cascade,
  comparison_type text not null,
  title text not null, source text not null, source_version text,
  status text not null default 'completed',
  metadata jsonb not null default '{}',
  imported_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index character_build_comparisons_character_idx on public.character_build_comparisons(character_id,comparison_type);
create index character_build_comparisons_game_idx on public.character_build_comparisons(game_id,status);

create table public.character_build_comparison_entries (
  id text primary key,
  comparison_id text not null references public.character_build_comparisons(id) on delete cascade,
  equipment_id uuid references public.game_equipment(id),
  set_id uuid references public.game_equipment_sets(id),
  label text not null, raw_label text not null,
  damage numeric, relative_value numeric, sort_order integer not null default 0,
  details jsonb not null default '{}'
);
create index character_build_comparison_entries_parent_idx on public.character_build_comparison_entries(comparison_id,sort_order);
create index character_build_comparison_entries_equipment_idx on public.character_build_comparison_entries(equipment_id);
create index character_build_comparison_entries_set_idx on public.character_build_comparison_entries(set_id);

alter table public.character_abilities enable row level security;
alter table public.character_build_comparisons enable row level security;
alter table public.character_build_comparison_entries enable row level security;
create policy "Public character abilities" on public.character_abilities for select to anon,authenticated using(true);
create policy "Public completed comparisons" on public.character_build_comparisons for select to anon,authenticated using(status='completed');
create policy "Public completed entries" on public.character_build_comparison_entries for select to anon,authenticated
  using(exists(select 1 from public.character_build_comparisons c where c.id=comparison_id and c.status='completed'));
revoke all on public.character_abilities, public.character_build_comparisons, public.character_build_comparison_entries from anon,authenticated;
grant select on public.character_abilities, public.character_build_comparisons, public.character_build_comparison_entries to anon,authenticated;
grant all on public.character_abilities, public.character_build_comparisons, public.character_build_comparison_entries to service_role;
