-- Live room reactions: lightweight realtime engagement events.
-- Chat messages already stream via live_room_messages; reactions are
-- transient events rendered as floating animations over the room.

create table if not exists public.live_room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.live_rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reaction_code text not null check (reaction_code in ('fire', 'heart', 'like', 'clap')),
  created_at timestamptz not null default now()
);
create index if not exists live_room_reactions_room_idx on public.live_room_reactions (room_id, created_at desc);

alter table public.live_room_reactions enable row level security;
create policy "live room reactions visible to participants" on public.live_room_reactions
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from public.live_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.visibility in ('public', 'unlisted')))
    or public.is_admin()
  );
create policy "users react in live rooms" on public.live_room_reactions
  for insert with check (profile_id = auth.uid());

alter publication supabase_realtime add table public.live_room_reactions;
