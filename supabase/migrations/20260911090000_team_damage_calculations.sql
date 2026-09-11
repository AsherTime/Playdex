create table public.team_damage_calculations (
  id uuid primary key,
  game_id text not null references public.games(id),
  source text not null,
  source_id text not null,
  team_name text not null,
  team_dps numeric,
  dpr numeric,
  rotation_seconds numeric,
  details jsonb not null default '{}'::jsonb,
  unique (game_id, source, source_id)
);

create table public.team_damage_calculation_members (
  calculation_id uuid not null references public.team_damage_calculations(id) on delete cascade,
  slot smallint not null check (slot between 1 and 4),
  character_id text not null references public.game_characters(id),
  character_name text not null,
  weapon_name text,
  role text,
  element text,
  damage numeric,
  damage_share numeric,
  details jsonb not null default '{}'::jsonb,
  primary key (calculation_id, slot),
  unique (calculation_id, character_id)
);
create index team_damage_calculation_members_character_idx
  on public.team_damage_calculation_members (character_id, calculation_id);
create index team_damage_calculations_game_dps_idx
  on public.team_damage_calculations (game_id, team_dps desc);

alter table public.team_damage_calculations enable row level security;
alter table public.team_damage_calculation_members enable row level security;
revoke all on public.team_damage_calculations, public.team_damage_calculation_members from anon, authenticated;
grant select on public.team_damage_calculations, public.team_damage_calculation_members to anon, authenticated;
grant all on public.team_damage_calculations, public.team_damage_calculation_members to service_role;
create policy "Public calculation reads" on public.team_damage_calculations for select to anon, authenticated using (true);
create policy "Public calculation member reads" on public.team_damage_calculation_members for select to anon, authenticated using (true);

comment on column public.team_damage_calculations.team_dps is 'Stored source DPS in damage per second, converted from exported k; never recomputed.';
comment on column public.team_damage_calculations.dpr is 'Source damage per rotation in raw damage units, converted from exported millions.';
comment on column public.team_damage_calculation_members.damage is 'Explicit source damage only, in raw units. Null when only a rounded share was provided.';
comment on column public.team_damage_calculation_members.damage_share is 'Source percentage points, unchanged; not normalized to sum to 100.';
