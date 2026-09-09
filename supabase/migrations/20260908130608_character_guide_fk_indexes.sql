-- Cover foreign keys added by the character guide backend migration.

create index if not exists character_builds_guide_source_record_idx
  on public.character_builds (guide_source_record_id);

create index if not exists guide_records_game_idx
  on public.character_guide_source_records (game_id);

create index if not exists guide_records_guide_source_idx
  on public.character_guide_source_records (guide_source_id);

create index if not exists character_kits_guide_source_record_idx
  on public.character_kits (guide_source_record_id);

create index if not exists character_team_comps_guide_source_record_idx
  on public.character_team_comps (guide_source_record_id);

create index if not exists character_team_members_character_idx
  on public.character_team_members (character_id);
