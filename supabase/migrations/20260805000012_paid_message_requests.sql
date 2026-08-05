-- Test paid-message requests. No real charge or payout is performed here;
-- this validates the consent flow before payment partner/KYC integration.

do $$
begin
  create type public.message_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists message_requests_enabled boolean not null default false,
  add column if not exists paid_message_price_minor bigint check (paid_message_price_minor is null or paid_message_price_minor > 0);

create table if not exists public.paid_message_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  status public.message_request_status not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists paid_message_creator_idx on public.paid_message_requests (creator_id, created_at desc);
create index if not exists paid_message_sender_idx on public.paid_message_requests (sender_id, created_at desc);

alter table public.paid_message_requests enable row level security;

create policy "senders and creators read message requests" on public.paid_message_requests
  for select using (sender_id = auth.uid() or creator_id = auth.uid() or public.is_admin());
create policy "users submit message requests" on public.paid_message_requests
  for insert with check (sender_id = auth.uid() and sender_id <> creator_id);
create policy "creators decide message requests" on public.paid_message_requests
  for update using (creator_id = auth.uid() or public.is_admin()) with check (creator_id = auth.uid() or public.is_admin());
