-- Test creator subscriptions. Recurring billing and real payout are deferred.

do $$
begin
  create type public.creator_subscription_status as enum ('active', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists subscriptions_enabled boolean not null default false,
  add column if not exists subscription_price_minor bigint check (subscription_price_minor is null or subscription_price_minor > 0);

create table if not exists public.creator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  status public.creator_subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  unique (creator_id, subscriber_id)
);

create index if not exists creator_subscriptions_creator_idx on public.creator_subscriptions (creator_id, status, expires_at desc);

alter table public.creator_subscriptions enable row level security;
create policy "creator and subscriber see subscriptions" on public.creator_subscriptions
  for select using (creator_id = auth.uid() or subscriber_id = auth.uid() or public.is_admin());
