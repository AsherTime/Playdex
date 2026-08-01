-- Align collector cadence metadata with 12-hour scheduled runs.
update public.game_sources
set
  cadence = '12 hours',
  cadence_minutes = 720,
  updated_at = timezone('utc', now())
where enabled = true;

alter table public.game_sources
  alter column cadence set default '12 hours';

alter table public.game_sources
  alter column cadence_minutes set default 720;
