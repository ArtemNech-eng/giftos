-- Extend report targets with wish comments and live rooms.
-- 'story' was already added by migration 32.

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_target_type' and e.enumlabel = 'wish_comment'
  ) then
    alter type public.report_target_type add value 'wish_comment';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_target_type' and e.enumlabel = 'live_room'
  ) then
    alter type public.report_target_type add value 'live_room';
  end if;
end $$;
