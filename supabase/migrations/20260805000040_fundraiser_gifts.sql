-- Virtual gifts for fundraisers: a supporter can send a gift to the
-- fundraiser author right from the discussion. Same economics as story/live
-- gifts: 20% test platform fee, 80% creator net, ledger source_type 'gift'.

create table if not exists public.fundraiser_gifts (
  id uuid primary key default gen_random_uuid(),
  fundraiser_id uuid not null references public.fundraisers(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null references public.virtual_gifts(code) on delete restrict,
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  created_at timestamptz not null default now()
);
create index if not exists fundraiser_gifts_fundraiser_idx on public.fundraiser_gifts (fundraiser_id, created_at desc);

alter table public.fundraiser_gifts enable row level security;
create policy "fundraiser gifts visible to participants" on public.fundraiser_gifts
  for select using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.fundraisers f
      where f.id = fundraiser_id and public.can_access_fundraiser(f.id)
    )
    or public.is_admin()
  );
create policy "users send fundraiser gifts" on public.fundraiser_gifts
  for insert with check (sender_id = auth.uid());

alter publication supabase_realtime add table public.fundraiser_gifts;
