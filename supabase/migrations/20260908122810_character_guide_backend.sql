-- Character guide backend
--
-- Public guide data is readable by anon/authenticated users. Writes are intended
-- to happen only from trusted server-side importers using the service role key.

create table if not exists public.guide_sources (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  source_site text not null,
  source_type text not null,
  name text not null,
  base_url text not null,
  enabled boolean not null default true,
  status text not null default 'pending',
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guide_sources_site_check check (source_site in ('nanoka', 'icy-veins', 'ign', 'manual')),
  constraint guide_sources_type_check check (source_type in ('roster', 'kit', 'build', 'team')),
  constraint guide_sources_status_check check (status in ('pending', 'healthy', 'partial', 'missing', 'failed', 'disabled')),
  unique (game_id, source_site, source_type)
);

create table if not exists public.game_characters (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  slug text not null,
  name text not null,
  display_name text not null,
  source_character_id text,
  rarity integer check (rarity is null or rarity between 1 and 6),
  element text,
  weapon_type text,
  release_date date,
  icon_key text,
  portrait_url text,
  is_playable boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, slug)
);

create table if not exists public.character_aliases (
  id uuid primary key default gen_random_uuid(),
  character_id text not null references public.game_characters(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source_site text not null,
  source_character_id text,
  source_slug text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (game_id, source_site, normalized_alias)
);

create table if not exists public.character_guide_source_records (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  character_id text references public.game_characters(id) on delete cascade,
  guide_source_id text references public.guide_sources(id) on delete set null,
  source_site text not null,
  source_type text not null,
  source_url text not null,
  source_character_id text,
  source_slug text,
  status text not null,
  content_hash text,
  error text,
  missing_fields text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guide_records_site_check check (source_site in ('nanoka', 'icy-veins', 'ign', 'manual')),
  constraint guide_records_type_check check (source_type in ('roster', 'kit', 'build', 'team')),
  constraint guide_records_status_check check (status in ('success', 'partial', 'missing', 'failed'))
);

create table if not exists public.character_kits (
  id text primary key,
  character_id text not null unique references public.game_characters(id) on delete cascade,
  guide_source_record_id text references public.character_guide_source_records(id) on delete set null,
  source_site text not null default 'nanoka',
  source_url text not null,
  source_version text,
  normal_attack jsonb,
  elemental_skill jsonb,
  elemental_burst jsonb,
  passive_talents jsonb,
  constellations jsonb,
  rule_terms jsonb,
  imported_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_builds (
  id text primary key,
  character_id text not null references public.game_characters(id) on delete cascade,
  guide_source_record_id text references public.character_guide_source_records(id) on delete set null,
  source_site text not null default 'icy-veins',
  source_url text not null,
  build_name text not null default 'Default',
  role text,
  patch text,
  best_weapons jsonb,
  alternative_weapons jsonb,
  f2p_weapons jsonb,
  best_artifacts jsonb,
  alternative_artifacts jsonb,
  main_stats jsonb,
  substat_priority jsonb,
  talent_priority jsonb,
  energy_recharge text,
  rotation jsonb,
  structured_sections jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_id, source_site, build_name)
);

create table if not exists public.character_team_comps (
  id text primary key,
  character_id text not null references public.game_characters(id) on delete cascade,
  guide_source_record_id text references public.character_guide_source_records(id) on delete set null,
  source_site text not null default 'ign',
  source_url text not null,
  team_name text,
  team_type text,
  rank_order integer not null default 1,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references public.character_team_comps(id) on delete cascade,
  slot_number integer not null check (slot_number > 0),
  character_id text references public.game_characters(id) on delete set null,
  character_name text not null,
  role text,
  is_flex boolean not null default false,
  alternatives text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (team_id, slot_number)
);

create table if not exists public.guide_import_runs (
  id uuid primary key default gen_random_uuid(),
  game_id text references public.games(id) on delete set null,
  importer text not null,
  scope text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_characters integer not null default 0,
  successful_records integer not null default 0,
  failed_records integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint guide_import_runs_status_check check (status in ('running', 'completed', 'partial', 'failed'))
);

create index if not exists game_characters_game_name_idx
  on public.game_characters (game_id, name);

create index if not exists game_characters_game_slug_idx
  on public.game_characters (game_id, slug);

create index if not exists character_aliases_character_idx
  on public.character_aliases (character_id);

create index if not exists character_aliases_normalized_idx
  on public.character_aliases (game_id, normalized_alias);

create index if not exists guide_source_records_character_idx
  on public.character_guide_source_records (character_id, source_site, source_type);

create index if not exists character_kits_character_idx
  on public.character_kits (character_id);

create index if not exists character_builds_character_idx
  on public.character_builds (character_id);

create index if not exists character_team_comps_character_idx
  on public.character_team_comps (character_id);

create index if not exists character_team_members_team_idx
  on public.character_team_members (team_id, slot_number);

create index if not exists guide_import_runs_game_started_idx
  on public.guide_import_runs (game_id, started_at desc);

drop trigger if exists guide_sources_set_updated_at on public.guide_sources;
create trigger guide_sources_set_updated_at
  before update on public.guide_sources
  for each row execute function public.set_updated_at();

drop trigger if exists game_characters_set_updated_at on public.game_characters;
create trigger game_characters_set_updated_at
  before update on public.game_characters
  for each row execute function public.set_updated_at();

drop trigger if exists guide_records_set_updated_at on public.character_guide_source_records;
create trigger guide_records_set_updated_at
  before update on public.character_guide_source_records
  for each row execute function public.set_updated_at();

drop trigger if exists character_kits_set_updated_at on public.character_kits;
create trigger character_kits_set_updated_at
  before update on public.character_kits
  for each row execute function public.set_updated_at();

drop trigger if exists character_builds_set_updated_at on public.character_builds;
create trigger character_builds_set_updated_at
  before update on public.character_builds
  for each row execute function public.set_updated_at();

drop trigger if exists character_team_comps_set_updated_at on public.character_team_comps;
create trigger character_team_comps_set_updated_at
  before update on public.character_team_comps
  for each row execute function public.set_updated_at();

alter table public.guide_sources enable row level security;
alter table public.game_characters enable row level security;
alter table public.character_aliases enable row level security;
alter table public.character_guide_source_records enable row level security;
alter table public.character_kits enable row level security;
alter table public.character_builds enable row level security;
alter table public.character_team_comps enable row level security;
alter table public.character_team_members enable row level security;
alter table public.guide_import_runs enable row level security;

drop policy if exists "Public enabled guide sources are readable" on public.guide_sources;
create policy "Public enabled guide sources are readable"
  on public.guide_sources for select
  to anon, authenticated
  using (enabled = true);

drop policy if exists "Public game characters are readable" on public.game_characters;
create policy "Public game characters are readable"
  on public.game_characters for select
  to anon, authenticated
  using (true);

drop policy if exists "Public character aliases are readable" on public.character_aliases;
create policy "Public character aliases are readable"
  on public.character_aliases for select
  to anon, authenticated
  using (true);

drop policy if exists "Public guide source records are readable" on public.character_guide_source_records;
create policy "Public guide source records are readable"
  on public.character_guide_source_records for select
  to anon, authenticated
  using (true);

drop policy if exists "Public character kits are readable" on public.character_kits;
create policy "Public character kits are readable"
  on public.character_kits for select
  to anon, authenticated
  using (true);

drop policy if exists "Public character builds are readable" on public.character_builds;
create policy "Public character builds are readable"
  on public.character_builds for select
  to anon, authenticated
  using (true);

drop policy if exists "Public character team comps are readable" on public.character_team_comps;
create policy "Public character team comps are readable"
  on public.character_team_comps for select
  to anon, authenticated
  using (true);

drop policy if exists "Public character team members are readable" on public.character_team_members;
create policy "Public character team members are readable"
  on public.character_team_members for select
  to anon, authenticated
  using (true);

drop policy if exists "Public guide import runs are readable" on public.guide_import_runs;
create policy "Public guide import runs are readable"
  on public.guide_import_runs for select
  to anon, authenticated
  using (true);

grant select on public.guide_sources to anon, authenticated;
grant select on public.game_characters to anon, authenticated;
grant select on public.character_aliases to anon, authenticated;
grant select on public.character_guide_source_records to anon, authenticated;
grant select on public.character_kits to anon, authenticated;
grant select on public.character_builds to anon, authenticated;
grant select on public.character_team_comps to anon, authenticated;
grant select on public.character_team_members to anon, authenticated;
grant select on public.guide_import_runs to anon, authenticated;

insert into public.guide_sources (id, game_id, source_site, source_type, name, base_url, enabled, status, metadata)
values
  ('genshin-impact-nanoka-roster', 'genshin-impact', 'nanoka', 'roster', 'Nanoka Genshin roster data', 'https://gi.nanoka.cc/', true, 'pending', '{"scope":"released_characters"}'::jsonb),
  ('genshin-impact-nanoka-kit', 'genshin-impact', 'nanoka', 'kit', 'Nanoka Genshin character kit data', 'https://gi.nanoka.cc/', true, 'pending', '{"allowed_fields":["normal_attack","elemental_skill","elemental_burst","passive_talents","constellations","rule_terms"]}'::jsonb),
  ('genshin-impact-icy-veins-build', 'genshin-impact', 'icy-veins', 'build', 'Icy Veins Genshin build guides', 'https://www.icy-veins.com/genshin-impact/', true, 'pending', '{"preserve_rankings":true}'::jsonb),
  ('genshin-impact-ign-team', 'genshin-impact', 'ign', 'team', 'IGN Genshin team guides', 'https://www.ign.com/wikis/genshin-impact/', true, 'pending', '{"source_rule":"teams_only"}'::jsonb)
on conflict (id) do update set
  game_id = excluded.game_id,
  source_site = excluded.source_site,
  source_type = excluded.source_type,
  name = excluded.name,
  base_url = excluded.base_url,
  enabled = excluded.enabled,
  metadata = excluded.metadata,
  updated_at = now();
