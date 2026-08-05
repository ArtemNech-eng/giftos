-- Test creator earnings ledger. Real payouts remain disabled until KYC and a
-- payment-partner agreement are in place.

create table if not exists public.creator_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('story_unlock', 'support', 'subscription', 'gift')),
  source_id uuid not null,
  gross_minor bigint not null check (gross_minor >= 0),
  platform_fee_minor bigint not null check (platform_fee_minor >= 0),
  creator_net_minor bigint not null check (creator_net_minor >= 0),
  currency char(3) not null default 'RUB',
  status text not null default 'test' check (status in ('test', 'pending', 'available', 'paid_out', 'refunded')),
  created_at timestamptz not null default now(),
  unique (source_type, source_id),
  check (gross_minor = platform_fee_minor + creator_net_minor)
);

create index if not exists creator_ledger_creator_idx on public.creator_ledger_entries (creator_id, created_at desc);

alter table public.creator_ledger_entries enable row level security;

create policy "creators see own earnings ledger" on public.creator_ledger_entries
  for select using (creator_id = auth.uid() or public.is_admin());
