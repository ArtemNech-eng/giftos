-- Live room donations: test-mode tips with a personal message.
-- The message is rendered as an overlay banner over the media area for
-- every participant in real time (story-like toaster).

create table if not exists public.live_room_donations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.live_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 500),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'RUB',
  created_at timestamptz not null default now()
);
create index if not exists live_room_donations_room_idx on public.live_room_donations (room_id, created_at desc);

alter table public.live_room_donations enable row level security;
create policy "live room donations visible to participants" on public.live_room_donations
  for select using (
    sender_id = auth.uid()
    or exists (select 1 from public.live_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.visibility in ('public', 'unlisted')))
    or public.is_admin()
  );
create policy "users send live room donations" on public.live_room_donations
  for insert with check (sender_id = auth.uid());

-- Donations are test creator income like gifts: 20% platform fee, 80% host net.
alter table public.creator_ledger_entries
  drop constraint if exists creator_ledger_entries_source_type_check;
alter table public.creator_ledger_entries
  add constraint creator_ledger_entries_source_type_check
  check (source_type in ('story_unlock', 'support', 'subscription', 'gift', 'message_request', 'live_donation'));

alter publication supabase_realtime add table public.live_room_donations;
