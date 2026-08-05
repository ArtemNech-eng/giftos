-- Stage 3: integrate places with live rooms, events and moderation.

-- Live rooms can belong to a place (stream inside the place).
alter table public.live_rooms
  add column if not exists place_id uuid references public.places(id) on delete set null;
create index if not exists live_rooms_place_idx on public.live_rooms (place_id, started_at desc) where status = 'live';

-- Events can belong to a place.
alter table public.events
  add column if not exists place_id uuid references public.places(id) on delete set null;
create index if not exists events_place_idx on public.events (place_id, starts_at desc) where not is_cancelled;

-- Moderation targets for places and place messages.
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_target_type' and e.enumlabel = 'place'
  ) then
    alter type public.report_target_type add value 'place';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_target_type' and e.enumlabel = 'place_message'
  ) then
    alter type public.report_target_type add value 'place_message';
  end if;
end $$;
