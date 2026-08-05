create table if not exists public.live_room_gifts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.live_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null references public.virtual_gifts(code) on delete restrict,
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  created_at timestamptz not null default now()
);
create index if not exists live_room_gifts_room_idx on public.live_room_gifts (room_id, created_at desc);

alter table public.live_room_gifts enable row level security;
create policy "live room gifts visible to participants" on public.live_room_gifts
  for select using (
    sender_id = auth.uid()
    or exists (select 1 from public.live_rooms r where r.id = room_id and (r.host_id = auth.uid() or r.visibility in ('public','unlisted')))
    or public.is_admin()
  );
create policy "users send live room gifts" on public.live_room_gifts
  for insert with check (sender_id = auth.uid());
