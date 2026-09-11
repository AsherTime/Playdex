alter table public.team_damage_calculation_members
  add column equipment_id uuid references public.game_equipment(id) on delete set null;
create index team_calculation_members_equipment_idx on public.team_damage_calculation_members(equipment_id);
