-- Gifts inside the space: send a virtual gift to a person you meet in a
-- place (not only during a live). Same economics as other gifts: 20% test
-- platform fee, 80% creator net, ledger source_type 'gift'.

create table if not exists public.place_gifts (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null references public.virtual_gifts(code) on delete restrict,
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists place_gifts_place_idx on public.place_gifts (place_id, created_at desc);
create index if not exists place_gifts_recipient_idx on public.place_gifts (recipient_id, created_at desc);

alter table public.place_gifts enable row level security;
create policy "place gifts visible to participants" on public.place_gifts
  for select using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_admin()
  );
create policy "users send place gifts" on public.place_gifts
  for insert with check (sender_id = auth.uid());

alter publication supabase_realtime add table public.place_gifts;
