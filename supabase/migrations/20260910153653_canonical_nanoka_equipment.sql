-- Canonical equipment is independent of character build recommendations.
-- Version matches the migration applied through the Supabase connector.
create table public.game_weapons (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  source_id text not null,
  slug text not null,
  name text not null,
  weapon_type text,
  weapon_type_code text,
  rarity integer check (rarity between 1 and 5),
  icon_url text,
  icon_key text,
  base_atk numeric,
  stat_level integer not null default 1,
  secondary_stat_name text,
  secondary_stat_code text,
  secondary_stat_value numeric,
  secondary_stat_raw_value numeric,
  secondary_stat_unit text check (secondary_stat_unit in ('percent', 'flat', 'raw')),
  passive_name text,
  passive_description text,
  refinement_values jsonb not null default '[]',
  stat_progression jsonb not null default '{}',
  source_site text not null default 'nanoka',
  source_url text not null,
  source_data_url text not null,
  source_version text not null,
  raw_data jsonb not null,
  content_hash text not null,
  missing_fields text[] not null default '{}',
  imported_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  unique (game_id, source_id)
);
create index game_weapons_game_slug_idx on public.game_weapons(game_id, slug);

create table public.game_artifact_sets (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  source_id text not null,
  slug text not null,
  name text not null,
  icon_url text,
  icon_key text,
  rarities integer[],
  two_piece_bonus text,
  four_piece_bonus text,
  additional_effects jsonb not null default '[]',
  set_effects jsonb not null default '[]',
  source_site text not null default 'nanoka',
  source_url text not null,
  source_data_url text not null,
  source_version text not null,
  raw_data jsonb not null,
  content_hash text not null,
  missing_fields text[] not null default '{}',
  imported_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  unique (game_id, source_id)
);
create index game_artifact_sets_game_slug_idx on public.game_artifact_sets(game_id, slug);

alter table public.game_weapons enable row level security;
alter table public.game_artifact_sets enable row level security;
create policy "Public canonical weapons" on public.game_weapons for select to anon, authenticated using (true);
create policy "Public canonical artifact sets" on public.game_artifact_sets for select to anon, authenticated using (true);
revoke all on public.game_weapons, public.game_artifact_sets from anon, authenticated;
grant select on public.game_weapons, public.game_artifact_sets to anon, authenticated;
grant all on public.game_weapons, public.game_artifact_sets to service_role;

comment on column public.game_weapons.base_atk is 'Exact Nanoka initial/base ATK at level 1, before ascension; not level 90 ATK.';
comment on column public.game_weapons.secondary_stat_value is 'Level 1 display value: percent stats multiplied by 100; raw value stored separately.';
comment on column public.game_artifact_sets.rarities is 'Rarity array supplied by Nanoka, without inferring released drop availability.';
