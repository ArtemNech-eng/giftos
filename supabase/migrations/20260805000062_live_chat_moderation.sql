-- Live room chat moderation:
-- 1) hidden flag on chat messages (mirrors place_messages),
-- 2) RLS: hidden messages invisible to everyone except admins and room hosts,
-- 3) DB-level chat rate limit (20 messages/min per author per room),
-- 4) new report target type 'live_message'.

alter table public.live_room_messages
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz;

create index if not exists live_room_messages_active_idx
  on public.live_room_messages (room_id, created_at asc) where not is_hidden;

drop policy if exists "live room chat visible" on public.live_room_messages;
create policy "live room chat visible" on public.live_room_messages for select using (
  not is_hidden
  or public.is_admin()
  or exists (
    select 1 from public.live_rooms r
    where r.id = room_id and r.host_id = auth.uid()
  )
);

drop policy if exists "hosts hide live chat messages" on public.live_room_messages;
create policy "hosts hide live chat messages" on public.live_room_messages
  for update using (
    exists (
      select 1 from public.live_rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
    or exists (
      select 1 from public.live_room_participants p
      where p.room_id = room_id
        and p.profile_id = auth.uid()
        and p.role = 'cohost'
        and p.left_at is null
    )
    or public.is_admin()
  ) with check (true);

-- Anti-spam: an author may post at most 20 chat messages per minute per room.
create or replace function public.live_room_message_rate_limit()
returns trigger
language plpgsql
security invoker
as $$
begin
  if (
    select count(*)
    from public.live_room_messages m
    where m.room_id = new.room_id
      and m.author_id = new.author_id
      and m.created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'live_chat_rate_limit: too many messages, wait a minute';
  end if;
  return new;
end;
$$;

drop trigger if exists live_room_message_rate_limit_trg on public.live_room_messages;
create trigger live_room_message_rate_limit_trg
  before insert on public.live_room_messages
  for each row execute function public.live_room_message_rate_limit();

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'report_target_type' and e.enumlabel = 'live_message'
  ) then
    alter type public.report_target_type add value 'live_message';
  end if;
end $$;
