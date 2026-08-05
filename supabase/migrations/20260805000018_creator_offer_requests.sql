do $$
begin
  create type public.creator_offer_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.creator_offer_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.creator_offers(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  note text check (note is null or char_length(note) <= 1000),
  price_minor bigint not null check (price_minor > 0),
  currency char(3) not null default 'RUB',
  status public.creator_offer_request_status not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists creator_offer_requests_creator_idx on public.creator_offer_requests (creator_id, created_at desc);
alter table public.creator_offer_requests enable row level security;

create policy "creator offer participants see requests" on public.creator_offer_requests
  for select using (creator_id = auth.uid() or requester_id = auth.uid() or public.is_admin());
create policy "users create offer requests" on public.creator_offer_requests
  for insert with check (requester_id = auth.uid() and requester_id <> creator_id);
create policy "creators decide offer requests" on public.creator_offer_requests
  for update using (creator_id = auth.uid() or public.is_admin()) with check (creator_id = auth.uid() or public.is_admin());

alter table public.creator_ledger_entries
  drop constraint if exists creator_ledger_entries_source_type_check;
alter table public.creator_ledger_entries
  add constraint creator_ledger_entries_source_type_check
  check (source_type in ('story_unlock', 'support', 'subscription', 'gift', 'message_request', 'offer_request'));
